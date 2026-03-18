/**
 * Tests for contract-builder reducer — pure functions, no mocks needed.
 */

import type { Contributor } from '@/src/features/researcher/types/contract';
import {
  contractBuilderReducer,
  initialState,
  selectTotalPct,
  selectIsValid,
  selectAllSigned,
  selectHasSigned,
  selectCurrentUserHasSigned,
  type ContractBuilderState,
  type ContractBuilderAction,
} from './contract-builder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContributor(overrides: Partial<Contributor> = {}): Contributor {
  return {
    id: 1,
    wallet: '0xabc',
    did: '0xabc',
    name: 'Alice',
    orcid: '—',
    pct: 50,
    role: 'Lead Author',
    status: 'pending',
    txHash: null,
    signedAt: null,
    isCreator: false,
    ...overrides,
  };
}

function stateWith(
  overrides: Partial<ContractBuilderState> = {},
): ContractBuilderState {
  return { ...initialState, ...overrides };
}

// ---------------------------------------------------------------------------
// Reducer action tests
// ---------------------------------------------------------------------------

describe('contractBuilderReducer', () => {
  describe('SET_SELECTED_DRAFT', () => {
    it('sets selectedDraft to the given value', () => {
      const result = contractBuilderReducer(initialState, {
        type: 'SET_SELECTED_DRAFT',
        selectedDraft: 3,
      });
      expect(result.selectedDraft).toBe(3);
    });

    it('sets selectedDraft to null', () => {
      const result = contractBuilderReducer(stateWith({ selectedDraft: 3 }), {
        type: 'SET_SELECTED_DRAFT',
        selectedDraft: null,
      });
      expect(result.selectedDraft).toBeNull();
    });
  });

  describe('SELECT_DRAFT_LOADED', () => {
    it('sets contributors and selectedContractId', () => {
      const contribs = [makeContributor()];
      const result = contractBuilderReducer(initialState, {
        type: 'SELECT_DRAFT_LOADED',
        contributors: contribs,
        selectedContractId: 'contract-1',
      });
      expect(result.contributors).toBe(contribs);
      expect(result.selectedContractId).toBe('contract-1');
    });

    it('allows null selectedContractId', () => {
      const result = contractBuilderReducer(initialState, {
        type: 'SELECT_DRAFT_LOADED',
        contributors: [],
        selectedContractId: null,
      });
      expect(result.selectedContractId).toBeNull();
    });
  });

  describe('UPDATE_CONTRIBUTOR', () => {
    it('updates pct for existing contributor', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1, pct: 50 })],
      });
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: 75,
      });
      expect(result.contributors[0].pct).toBe(75);
    });

    it('updates role for existing contributor', () => {
      const state = stateWith({ contributors: [makeContributor({ id: 1 })] });
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'role',
        value: 'Co-Author',
      });
      expect(result.contributors[0].role).toBe('Co-Author');
    });

    it('no-ops when contributor not found', () => {
      const state = stateWith({ contributors: [makeContributor({ id: 1 })] });
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 999,
        field: 'pct',
        value: 75,
      });
      expect(result).toBe(state);
    });

    it('no-ops when value is unchanged', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1, pct: 50 })],
      });
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: 50,
      });
      expect(result).toBe(state);
    });

    it('converts empty string to empty for pct field', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1, pct: 50 })],
      });
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: '',
      });
      expect(result.contributors[0].pct).toBe('');
    });

    it('converts string number to Number for pct field', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1, pct: 50 })],
      });
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: '75',
      });
      expect(result.contributors[0].pct).toBe(75);
    });
  });

  // -----------------------------------------------------------------------
  // Signature cascade — the critical invariant
  // -----------------------------------------------------------------------

  describe('signature cascade on UPDATE_CONTRIBUTOR', () => {
    it('invalidates ALL signed contributors when any field changes', () => {
      const state = stateWith({
        contributors: [
          makeContributor({
            id: 1,
            pct: 50,
            status: 'signed',
            txHash: '0x1',
            signedAt: '2025-01-01',
          }),
          makeContributor({
            id: 2,
            pct: 50,
            status: 'signed',
            txHash: '0x2',
            signedAt: '2025-01-02',
            wallet: '0xdef',
          }),
        ],
      });

      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: 60,
      });

      // Both contributors should be reset
      expect(result.contributors[0].status).toBe('pending');
      expect(result.contributors[0].txHash).toBeNull();
      expect(result.contributors[0].signedAt).toBeNull();
      expect(result.contributors[1].status).toBe('pending');
      expect(result.contributors[1].txHash).toBeNull();
      expect(result.contributors[1].signedAt).toBeNull();
    });

    it('does NOT cascade when no contributors are signed', () => {
      const state = stateWith({
        contributors: [
          makeContributor({ id: 1, pct: 50, status: 'pending' }),
          makeContributor({
            id: 2,
            pct: 50,
            status: 'pending',
            wallet: '0xdef',
          }),
        ],
      });

      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: 60,
      });

      expect(result.contributors[0].status).toBe('pending');
      expect(result.contributors[1].status).toBe('pending');
    });

    it('cascade on role change too', () => {
      const state = stateWith({
        contributors: [
          makeContributor({
            id: 1,
            status: 'signed',
            txHash: '0x1',
            signedAt: 't',
          }),
          makeContributor({ id: 2, status: 'pending', wallet: '0xdef' }),
        ],
      });

      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 2,
        field: 'role',
        value: 'Senior Author',
      });

      expect(result.contributors[0].status).toBe('pending');
      expect(result.contributors[0].txHash).toBeNull();
    });
  });

  describe('REMOVE_CONTRIBUTOR', () => {
    it('removes contributor by id', () => {
      const state = stateWith({
        contributors: [
          makeContributor({ id: 1 }),
          makeContributor({ id: 2, wallet: '0xdef' }),
        ],
      });
      const result = contractBuilderReducer(state, {
        type: 'REMOVE_CONTRIBUTOR',
        id: 1,
      });
      expect(result.contributors).toHaveLength(1);
      expect(result.contributors[0].id).toBe(2);
    });

    it('no-ops when id not found', () => {
      const state = stateWith({ contributors: [makeContributor({ id: 1 })] });
      const result = contractBuilderReducer(state, {
        type: 'REMOVE_CONTRIBUTOR',
        id: 999,
      });
      expect(result.contributors).toHaveLength(1);
    });
  });

  describe('ADD_CONTRIBUTOR', () => {
    it('appends contributor and hides add row', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1 })],
        showAddRow: true,
      });
      const newContrib = makeContributor({ id: 2, wallet: '0xdef' });
      const result = contractBuilderReducer(state, {
        type: 'ADD_CONTRIBUTOR',
        contributor: newContrib,
      });
      expect(result.contributors).toHaveLength(2);
      expect(result.contributors[1]).toBe(newContrib);
      expect(result.showAddRow).toBe(false);
    });
  });

  describe('SET_SHOW_ADD_ROW', () => {
    it('sets showAddRow', () => {
      const result = contractBuilderReducer(initialState, {
        type: 'SET_SHOW_ADD_ROW',
        showAddRow: true,
      });
      expect(result.showAddRow).toBe(true);
    });
  });

  describe('SET_SHOW_PREVIEW', () => {
    it('sets showPreview', () => {
      const result = contractBuilderReducer(initialState, {
        type: 'SET_SHOW_PREVIEW',
        showPreview: true,
      });
      expect(result.showPreview).toBe(true);
    });
  });

  describe('SHOW_INVITE_MODAL', () => {
    it('opens modal with invite link', () => {
      const result = contractBuilderReducer(initialState, {
        type: 'SHOW_INVITE_MODAL',
        inviteLink: 'https://example.com/invite/abc',
      });
      expect(result.showInviteModal).toBe(true);
      expect(result.inviteLink).toBe('https://example.com/invite/abc');
    });
  });

  describe('CLOSE_INVITE_MODAL', () => {
    it('closes modal', () => {
      const state = stateWith({ showInviteModal: true, inviteLink: 'link' });
      const result = contractBuilderReducer(state, {
        type: 'CLOSE_INVITE_MODAL',
      });
      expect(result.showInviteModal).toBe(false);
    });
  });

  describe('SIGN_DEMO', () => {
    it('marks contributor as signed with txHash and signedAt', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1, status: 'pending' })],
      });
      const result = contractBuilderReducer(state, {
        type: 'SIGN_DEMO',
        id: 1,
        txHash: '0xhash',
        signedAt: '2025-01-15T12:00:00Z',
      });
      expect(result.contributors[0].status).toBe('signed');
      expect(result.contributors[0].txHash).toBe('0xhash');
      expect(result.contributors[0].signedAt).toBe('2025-01-15T12:00:00Z');
    });

    it('does not affect other contributors', () => {
      const state = stateWith({
        contributors: [
          makeContributor({ id: 1, status: 'pending' }),
          makeContributor({ id: 2, status: 'pending', wallet: '0xdef' }),
        ],
      });
      const result = contractBuilderReducer(state, {
        type: 'SIGN_DEMO',
        id: 1,
        txHash: '0x1',
        signedAt: 'now',
      });
      expect(result.contributors[1].status).toBe('pending');
    });
  });

  describe('CONTRACT_CREATED', () => {
    it('sets selectedContractId and maps dbIds', () => {
      const state = stateWith({
        contributors: [
          makeContributor({ id: 1 }),
          makeContributor({ id: 2, wallet: '0xdef' }),
        ],
      });
      const result = contractBuilderReducer(state, {
        type: 'CONTRACT_CREATED',
        selectedContractId: 'contract-new',
        contributorDbIds: ['db-1', 'db-2'],
      });
      expect(result.selectedContractId).toBe('contract-new');
      expect(result.contributors[0].dbId).toBe('db-1');
      expect(result.contributors[1].dbId).toBe('db-2');
    });

    it('keeps existing dbId when contributorDbIds entry is undefined', () => {
      const state = stateWith({
        contributors: [makeContributor({ id: 1, dbId: 'old-id' })],
      });
      const result = contractBuilderReducer(state, {
        type: 'CONTRACT_CREATED',
        selectedContractId: 'c1',
        contributorDbIds: [undefined],
      });
      expect(result.contributors[0].dbId).toBe('old-id');
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const result = contractBuilderReducer(initialState, {
        type: 'DOES_NOT_EXIST',
      } as unknown as ContractBuilderAction);
      expect(result).toBe(initialState);
    });
  });

  describe('reducer purity', () => {
    it('does not mutate the original state or its nested objects', () => {
      const contributor = Object.freeze(makeContributor({ id: 1, pct: 50 }));
      const state = Object.freeze(
        stateWith({
          contributors: Object.freeze([contributor]) as Contributor[],
        }),
      ) as ContractBuilderState;

      // This should produce a new state without throwing
      const result = contractBuilderReducer(state, {
        type: 'UPDATE_CONTRIBUTOR',
        id: 1,
        field: 'pct',
        value: 75,
      });
      expect(result).not.toBe(state);
      expect(result.contributors[0]).not.toBe(contributor);
      expect(result.contributors[0].pct).toBe(75);
      // Original contributor remains unchanged
      expect(contributor.pct).toBe(50);
    });
  });
});

// ---------------------------------------------------------------------------
// Selector tests
// ---------------------------------------------------------------------------

describe('selectTotalPct', () => {
  it('sums contributor percentages', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, pct: 40 }),
        makeContributor({ id: 2, pct: 60, wallet: '0xdef' }),
      ],
    });
    expect(selectTotalPct(state)).toBe(100);
  });

  it('returns 0 with no contributors', () => {
    expect(selectTotalPct(initialState)).toBe(0);
  });

  it('treats empty string pct as 0', () => {
    const state = stateWith({
      contributors: [makeContributor({ id: 1, pct: '' as unknown as number })],
    });
    expect(selectTotalPct(state)).toBe(0);
  });
});

describe('selectIsValid', () => {
  it('true when pct sums to 100', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, pct: 60 }),
        makeContributor({ id: 2, pct: 40, wallet: '0xdef' }),
      ],
    });
    expect(selectIsValid(state)).toBe(true);
  });

  it('false when pct sums to < 100', () => {
    const state = stateWith({
      contributors: [makeContributor({ id: 1, pct: 50 })],
    });
    expect(selectIsValid(state)).toBe(false);
  });

  it('false when pct sums to > 100', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, pct: 60 }),
        makeContributor({ id: 2, pct: 60, wallet: '0xdef' }),
      ],
    });
    expect(selectIsValid(state)).toBe(false);
  });
});

describe('selectAllSigned', () => {
  it('true when all contributors are signed', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, status: 'signed' }),
        makeContributor({ id: 2, status: 'signed', wallet: '0xdef' }),
      ],
    });
    expect(selectAllSigned(state)).toBe(true);
  });

  it('false when any contributor is pending', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, status: 'signed' }),
        makeContributor({ id: 2, status: 'pending', wallet: '0xdef' }),
      ],
    });
    expect(selectAllSigned(state)).toBe(false);
  });

  it('false with no contributors', () => {
    expect(selectAllSigned(initialState)).toBe(false);
  });
});

describe('selectHasSigned', () => {
  it('true when at least one is signed', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, status: 'signed' }),
        makeContributor({ id: 2, status: 'pending', wallet: '0xdef' }),
      ],
    });
    expect(selectHasSigned(state)).toBe(true);
  });

  it('false when none signed', () => {
    const state = stateWith({
      contributors: [makeContributor({ id: 1, status: 'pending' })],
    });
    expect(selectHasSigned(state)).toBe(false);
  });
});

describe('selectCurrentUserHasSigned', () => {
  it('true when user wallet matches signed contributor (case-insensitive)', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, wallet: '0xABC', status: 'signed' }),
      ],
    });
    expect(selectCurrentUserHasSigned(state, '0xabc')).toBe(true);
  });

  it('false when user wallet matches but not signed', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, wallet: '0xabc', status: 'pending' }),
      ],
    });
    expect(selectCurrentUserHasSigned(state, '0xabc')).toBe(false);
  });

  it('false when wallet does not match', () => {
    const state = stateWith({
      contributors: [
        makeContributor({ id: 1, wallet: '0xabc', status: 'signed' }),
      ],
    });
    expect(selectCurrentUserHasSigned(state, '0xzzz')).toBe(false);
  });
});

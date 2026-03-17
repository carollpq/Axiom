/**
 * Drizzle DB mock factory for unit tests.
 * Returns a chainable mock that mirrors Drizzle's fluent API.
 */

type MockValue = unknown;

export function createMockDb(returnValue: MockValue = []) {
  const chain: Record<string, jest.Mock> = {};

  const createChainable = (finalValue: MockValue) => {
    const handler: ProxyHandler<jest.Mock> = {
      get(_target, prop: string) {
        if (prop === 'then') return undefined; // not a thenable
        if (!chain[prop]) {
          chain[prop] = jest.fn().mockReturnValue(new Proxy(jest.fn(), handler));
        }
        return chain[prop];
      },
      apply() {
        return new Proxy(jest.fn(), handler);
      },
    };

    // Terminal methods resolve
    const terminalMethods = ['returning', 'execute', 'get'];
    for (const m of terminalMethods) {
      chain[m] = jest.fn().mockResolvedValue(finalValue);
    }

    return new Proxy(jest.fn(), handler);
  };

  return {
    db: createChainable(returnValue),
    chain,
  };
}

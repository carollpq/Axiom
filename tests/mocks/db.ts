/**
 * Drizzle DB mock factory for unit tests.
 * Returns a chainable mock that mirrors Drizzle's fluent API.
 *
 * Supports both SELECT chains (awaitable via .then) and INSERT chains
 * (terminal via .returning()).
 */

type MockValue = unknown;

export function createMockDb(returnValue: MockValue = []) {
  const chain: Record<string, jest.Mock> = {};

  const createChainable = (finalValue: MockValue) => {
    const resolved = Promise.resolve(finalValue);
    const handler: ProxyHandler<jest.Mock> = {
      get(_target, prop: string) {
        // Make the proxy thenable so `await db.select().from().where()` works
        if (prop === 'then') {
          return (
            resolve: (v: unknown) => unknown,
            reject: (e: unknown) => unknown,
          ) => resolved.then(resolve, reject);
        }
        if (prop === 'catch' || prop === 'finally') {
          return resolved[prop as 'catch' | 'finally'].bind(resolved);
        }
        if (!chain[prop]) {
          chain[prop] = jest.fn().mockReturnValue(new Proxy(jest.fn(), handler));
        }
        return chain[prop];
      },
      apply() {
        return new Proxy(jest.fn(), handler);
      },
    };

    // Terminal methods that also resolve
    const terminalMethods = ['returning', 'execute', 'get', 'limit'];
    for (const m of terminalMethods) {
      chain[m] = jest.fn().mockReturnValue(new Proxy(jest.fn(), handler));
    }

    return new Proxy(jest.fn(), handler);
  };

  return {
    db: createChainable(returnValue),
    chain,
  };
}

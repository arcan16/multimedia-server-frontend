import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs `loader` on mount and whenever `deps` change.
 * Returns { data, error, loading, reload, setData }.
 * Responses from stale runs are ignored.
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const runId = useRef(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps)

  const run = useCallback(async () => {
    const id = ++runId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await load()
      if (id === runId.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === runId.current) setState((s) => ({ ...s, error, loading: false }))
    }
  }, [load])

  useEffect(() => {
    run()
  }, [run])

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])

  return { ...state, reload: run, setData }
}

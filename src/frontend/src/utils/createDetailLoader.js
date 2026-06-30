export function createDetailLoader(setLoading, setSelected, fetchFn, errorMsg, setError) {
  return async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchFn(id);
      setSelected(res.data.data);
    } catch {
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
}

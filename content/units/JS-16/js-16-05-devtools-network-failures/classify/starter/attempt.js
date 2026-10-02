// Runs one load and reports what happened, without deciding what it means:
//   { response, data }   the response was ok and its body parsed as JSON
//   { response }         the response was not ok (its body is not read)
//   { response, error }  the response was ok, but reading the body as JSON threw `error`
//   { error }            fetch itself rejected with `error`
export async function attempt(url, { signal } = {}) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    return { error };
  }
  if (!response.ok) return { response };
  try {
    return { response, data: await response.json() };
  } catch (error) {
    return { response, error };
  }
}

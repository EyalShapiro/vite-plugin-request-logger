const output = document.querySelector<HTMLDivElement>('#output')!;

async function sendRequest(url: string) {
  output.textContent = `Sending request to ${url}...`;
  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    output.textContent = `Response status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.textContent = `Error: ${errorMsg}`;
  }
}

document.querySelector('#btn-api')?.addEventListener('click', () => sendRequest('/api/users'));
document.querySelector('#btn-trpc')?.addEventListener('click', () => sendRequest('/trpc/getUser'));
document.querySelector('#btn-slow')?.addEventListener('click', () => sendRequest('/api/slow'));
document
  .querySelector('#btn-ignored')
  ?.addEventListener('click', () => sendRequest('/static/asset.js'));

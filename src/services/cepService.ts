import fetch from 'node-fetch';

const API_URL = 'https://brasil.cep.dev/v1';

export async function consultaCep(cep: string) {
  const response = await fetch(`${API_URL}/${cep}.json`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro ao consultar CEP (${cep}): Status ${response.status} - ${errorText}`);
    throw new Error(`CEP não encontrado ou erro na API. Status: ${response.status}`);
  }
  return response.json();
}

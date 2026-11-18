import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface Registro {
  ordem: number;
  modulo: string;
  caso: string;
  esperado: string;
  real: string;
  status: 'PASSOU' | 'FALHOU';
  evidencia?: string;
}

export const registros: Registro[] = [];
const PASTA = path.resolve(__dirname, '..', 'resultados');
const PASTA_PRINTS = path.join(PASTA, 'prints');

export const SUF = String(Date.now()).slice(-6);

export function cpfValido(n: number): string {

  const d: number[] = String(100_000_000 + ((n * 7919) % 800_000_000)).split('').map(Number);
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += d[i] * (t + 1 - i);
    const r = (soma * 10) % 11;
    d.push(r === 10 ? 0 : r);
  }
  const s = d.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

export function hojeISO(deslocamentoDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + deslocamentoDias);
  const m = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return m.toISOString().slice(0, 10);
}

export function caso(
  getPage: () => Page,
  modulo: string,
  titulo: string,
  esperado: string,
  fn: (page: Page) => Promise<string>,
) {
  test(`${modulo} · ${titulo}`, async () => {
    const page = getPage();
    const ordem = registros.length + 1;
    const arquivo = `${String(ordem).padStart(2, '0')}-${slug(modulo)}-${slug(titulo)}.png`;
    let real = '';
    let status: Registro['status'] = 'PASSOU';
    let erro: unknown;
    try {
      real = await fn(page);
    } catch (e) {
      status = 'FALHOU';
      erro = e;
      real = 'ERRO: ' + String((e as Error).message).split('\n').filter(Boolean).slice(0, 4).join(' | ');
    }
    let evidencia: string | undefined;
    try {
      fs.mkdirSync(PASTA_PRINTS, { recursive: true });
      await page.screenshot({ path: path.join(PASTA_PRINTS, arquivo) });
      evidencia = `prints/${arquivo}`;
    } catch {  }
    registros.push({ ordem, modulo, caso: titulo, esperado, real, status, evidencia });
    if (erro) throw erro;
  });
}

function slug(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export function salvarRegistros() {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(path.join(PASTA, 'resultados.json'), JSON.stringify(registros, null, 2), 'utf-8');
}

export async function ir(page: Page, rota: string, titulo: string) {
  await page.locator(`#menu a[data-rota="${rota}"]`).click();
  await expect(page.locator('#titulo-pagina')).toHaveText(titulo);
  await expect(page.locator('#app .carregando')).toHaveCount(0);
}

export const modal = (page: Page) => page.locator('#modal');
export const toast = (page: Page) => page.locator('.toast').last();

export async function escolher(select: Locator, trecho: string) {
  const valor = await select.locator('option', { hasText: trecho }).first().getAttribute('value');
  if (valor === null) throw new Error(`Opcao "${trecho}" nao encontrada`);
  await select.selectOption(valor);
}

export async function textoToast(page: Page, trecho: string | RegExp): Promise<string> {
  const t = page.locator('.toast', { hasText: trecho }).last();
  await expect(t).toBeVisible();
  return (await t.innerText()).trim();
}

export { expect };

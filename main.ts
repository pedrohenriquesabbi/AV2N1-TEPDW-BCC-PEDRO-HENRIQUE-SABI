// ===== Modelagem =====
interface Livro {
  id: number;
  titulo: string;
  categoria: string;
  ano: number;
  lido: boolean;
}

interface Resumo {
  total: number;
  lidos: number;
  pendentes: number;
}

type ErrosForm = Partial<Record<"titulo" | "categoria" | "ano", string>>;

// ===== Estado =====
const livros: Livro[] = [
  { id: 1, titulo: "Dom Casmurro", categoria: "Romance", ano: 1899, lido: true },
  { id: 2, titulo: "Duna", categoria: "Ficção científica", ano: 1965, lido: false },
  { id: 3, titulo: "Código Limpo", categoria: "Técnico", ano: 2008, lido: false },
];
let proximoId: number = 4;

const ANO_MINIMO = 1000;
const CORES: Record<string, string> = {
  "Romance": "#a23b4d",
  "Ficção científica": "#2d5fa8",
  "Fantasia": "#6b4aa1",
  "Técnico": "#0f6b5c",
  "Biografia": "#b7791f",
};

// ===== Acesso ao DOM (trata elementos nulos) =====
function obter<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (el === null) {
    throw new Error(`Elemento #${id} não encontrado no HTML.`);
  }
  return el as T;
}

const form = obter<HTMLFormElement>("form-livro");
const campoTitulo = obter<HTMLInputElement>("titulo");
const campoCategoria = obter<HTMLSelectElement>("categoria");
const campoAno = obter<HTMLInputElement>("ano");
const campoLido = obter<HTMLInputElement>("lido");
const campoBusca = obter<HTMLInputElement>("busca");
const filtroCategoria = obter<HTMLSelectElement>("filtro-categoria");
const lista = obter<HTMLUListElement>("lista");
const msgVazio = obter<HTMLParagraphElement>("vazio");
const resTotal = obter<HTMLElement>("res-total");
const resLidos = obter<HTMLElement>("res-lidos");
const resPendentes = obter<HTMLElement>("res-pendentes");

// ===== Funções de regra de negócio =====
function validar(titulo: string, categoria: string, anoTexto: string): ErrosForm {
  const erros: ErrosForm = {};
  if (titulo.trim() === "") {
    erros.titulo = "Informe o título.";
  }
  if (categoria === "") {
    erros.categoria = "Escolha uma categoria.";
  }
  const ano = Number(anoTexto);
  const anoAtual = new Date().getFullYear();
  if (anoTexto.trim() === "") {
    erros.ano = "Informe o ano.";
  } else if (!Number.isInteger(ano) || ano < ANO_MINIMO || ano > anoAtual) {
    erros.ano = `Digite um ano inteiro entre ${ANO_MINIMO} e ${anoAtual}.`;
  }
  return erros;
}

function adicionarLivro(titulo: string, categoria: string, ano: number, lido: boolean): Livro {
  const novo: Livro = { id: proximoId++, titulo: titulo.trim(), categoria, ano, lido };
  livros.push(novo);
  return novo;
}

function alternarEstado(id: number): void {
  const livro = livros.find((l: Livro): boolean => l.id === id);
  if (livro !== undefined) {
    livro.lido = !livro.lido;
  }
}

function removerLivro(id: number): void {
  const indice = livros.findIndex((l: Livro): boolean => l.id === id);
  if (indice !== -1) {
    livros.splice(indice, 1);
  }
}

function filtrarLivros(busca: string, categoria: string): Livro[] {
  const termo = busca.trim().toLowerCase();
  return livros.filter((l: Livro): boolean => {
    const bateTitulo = l.titulo.toLowerCase().includes(termo);
    const bateCategoria = categoria === "" || l.categoria === categoria;
    return bateTitulo && bateCategoria;
  });
}

function calcularResumo(): Resumo {
  const lidos = livros.filter((l: Livro): boolean => l.lido).length;
  return { total: livros.length, lidos, pendentes: livros.length - lidos };
}

// ===== Renderização =====
function criarCard(livro: Livro): HTMLLIElement {
  const li = document.createElement("li");
  li.className = livro.lido ? "livro lido" : "livro";

  const lombada = document.createElement("div");
  lombada.className = "lombada";
  lombada.style.setProperty("--cor", CORES[livro.categoria] ?? "#0f6b5c");

  const info = document.createElement("div");
  info.className = "info";
  const h3 = document.createElement("h3");
  h3.textContent = livro.titulo;
  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${livro.categoria}, ${livro.ano}`;
  info.append(h3, meta);

  const acoes = document.createElement("div");
  acoes.className = "acoes";

  const btnEstado = document.createElement("button");
  btnEstado.type = "button";
  btnEstado.className = livro.lido ? "estado lido" : "estado pendente";
  btnEstado.textContent = livro.lido ? "Lido" : "Para ler";
  btnEstado.setAttribute("aria-label", `Alterar estado de ${livro.titulo}`);
  btnEstado.dataset.acao = "alternar";
  btnEstado.dataset.id = String(livro.id);

  const btnRemover = document.createElement("button");
  btnRemover.type = "button";
  btnRemover.className = "remover";
  btnRemover.textContent = "Excluir";
  btnRemover.setAttribute("aria-label", `Excluir ${livro.titulo}`);
  btnRemover.dataset.acao = "remover";
  btnRemover.dataset.id = String(livro.id);

  acoes.append(btnEstado, btnRemover);
  li.append(lombada, info, acoes);
  return li;
}

function renderizarLista(): void {
  const visiveis = filtrarLivros(campoBusca.value, filtroCategoria.value);
  lista.replaceChildren(...visiveis.map(criarCard));

  if (visiveis.length === 0) {
    msgVazio.hidden = false;
    msgVazio.textContent =
      livros.length === 0
        ? "Sua estante está vazia. Cadastre o primeiro livro ao lado."
        : "Nenhum livro encontrado para essa busca ou categoria.";
  } else {
    msgVazio.hidden = true;
  }
}

function renderizarResumo(): void {
  const r = calcularResumo();
  resTotal.textContent = String(r.total);
  resLidos.textContent = String(r.lidos);
  resPendentes.textContent = String(r.pendentes);
}

function atualizarTela(): void {
  renderizarLista();
  renderizarResumo();
}

function preencherFiltroCategorias(): void {
  Array.from(campoCategoria.options)
    .filter((o: HTMLOptionElement): boolean => o.value !== "")
    .forEach((o: HTMLOptionElement): void => {
      filtroCategoria.add(new Option(o.value, o.value));
    });
}

function mostrarErros(erros: ErrosForm): void {
  const campos: Array<["titulo" | "categoria" | "ano", HTMLInputElement | HTMLSelectElement]> = [
    ["titulo", campoTitulo],
    ["categoria", campoCategoria],
    ["ano", campoAno],
  ];
  for (const [nome, campo] of campos) {
    const msg = erros[nome] ?? "";
    obter<HTMLElement>(`erro-${nome}`).textContent = msg;
    campo.classList.toggle("invalido", msg !== "");
  }
}

// ===== Eventos =====
form.addEventListener("submit", (e: SubmitEvent): void => {
  e.preventDefault();
  const erros = validar(campoTitulo.value, campoCategoria.value, campoAno.value);
  mostrarErros(erros);
  if (Object.keys(erros).length > 0) {
    return;
  }
  adicionarLivro(campoTitulo.value, campoCategoria.value, Number(campoAno.value), campoLido.checked);
  form.reset();
  campoTitulo.focus();
  atualizarTela();
});

campoBusca.addEventListener("input", renderizarLista);
filtroCategoria.addEventListener("change", renderizarLista);

// Delegação de eventos: um único listener para todos os botões dos cards
lista.addEventListener("click", (e: MouseEvent): void => {
  const alvo = e.target;
  if (!(alvo instanceof HTMLElement)) {
    return;
  }
  const botao = alvo.closest<HTMLButtonElement>("button[data-acao]");
  if (botao === null) {
    return;
  }
  const id = Number(botao.dataset.id);
  if (botao.dataset.acao === "alternar") {
    alternarEstado(id);
  } else if (botao.dataset.acao === "remover") {
    removerLivro(id);
  }
  atualizarTela();
});

// ===== Inicialização =====
preencherFiltroCategorias();
atualizarTela();
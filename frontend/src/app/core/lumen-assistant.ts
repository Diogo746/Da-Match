import { helpTopics } from "./lumen-topics";

// Classificador por vizinhos mais próximos: exemplos rotulados, vetores TF-IDF e similaridade de cosseno.
const stop = new Set("onde encontro vejo entre consigo a ao as com como da das de do dos e em eu meu minha na no nos o os para por posso que quero se um uma meus minhas".split(" "));
function tokens(sentence: string) {
  return [...new Set(sentence.normalize("NFD").replaceAll(/\p{M}/gu, "").toLowerCase()
    .split(/[^a-z0-9]+/u).filter(word => word.length > 1 && !stop.has(word)))];
}
const samples = helpTopics.flatMap(topic => [topic.prompt, ...topic.examples].map(text => ({ topic, words: tokens(text) })));
const frequencies = new Map<string, number>();
for (const sample of samples) for (const word of sample.words) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
function weight(word: string) { return (1 + Math.log((1 + samples.length) / (1 + (frequencies.get(word) ?? 0)))) ** 2; }
function norm(words: string[]) { return Math.sqrt(words.reduce((sum, word) => sum + weight(word), 0)); }
const vectors = samples.map(sample => ({ ...sample, length: norm(sample.words) }));
const topicWords = new Map(helpTopics.map(topic => [topic.key, new Set(vectors.filter(v => v.topic === topic).flatMap(v => v.words))]));
export function lumenReply(question: string, demo: boolean): string {
  const words = tokens(question.slice(0, 360));
  const length = norm(words);
  const best = new Map<string, number>();
  for (const v of vectors) {
    const dot = v.words.reduce((sum, word) => sum + (words.includes(word) ? weight(word) : 0), 0);
    const similarity = length ? dot / (length * v.length) : 0;
    best.set(v.topic.key, Math.max(best.get(v.topic.key) ?? 0, similarity));
  }
  // Diferencia combinações como “afinidade entre perfis” de uma busca genérica por perfis.
  for (const [key, score] of best) {
    const covered = words.filter(word => topicWords.get(key)?.has(word));
    const share = length ? (norm(covered) / length) ** 2 : 0;
    best.set(key, .55 * score + .45 * share);
  }
  const [first, second] = [...best.entries()].sort((a, b) => b[1] - a[1]);
  if (first[1] < .34 || first[1] - second[1] < .045) {
    return "Não reconheci essa dúvida com segurança. Tente perguntar sobre cadastro, descoberta de perfis, questionário, compatibilidade ou convites.";
  }
  const topic = helpTopics.find(item => item.key === first[0])!;
  return (demo && topic.demo) || topic.answer;
}

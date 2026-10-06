function cleanText(value) {
  return String(value ?? '').normalize('NFKC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
}

export function normalizeWordKey(value) {
  return cleanText(value).toLocaleLowerCase('en-US');
}

export function normalizeTopicKey(value) {
  return cleanText(value)
    .toLocaleLowerCase('vi-VN')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function topicMapRows(pack) {
  if (Array.isArray(pack)) return pack;
  if (Array.isArray(pack?.rows)) return pack.rows;
  return [];
}

export function hydrateTopicsWithWordMap(topics = [], vocab = [], mapPack = []) {
  const rows = topicMapRows(mapPack);
  const vocabByKey = new Map();
  for (const item of vocab) {
    const key = normalizeWordKey(item?.word);
    if (key && !vocabByKey.has(key)) vocabByKey.set(key, item);
  }

  const topicByKey = new Map();
  const wordSets = new Map();
  for (const topic of topics) {
    const set = new Map();
    for (const word of topic?.words || []) {
      const item = vocabByKey.get(normalizeWordKey(word));
      if (item) set.set(normalizeWordKey(item.word), item.word);
    }
    wordSets.set(topic, set);

    for (const label of [topic?.nameVi, topic?.name, topic?.label, topic?.id]) {
      const key = normalizeTopicKey(label);
      if (key && !topicByKey.has(key)) topicByKey.set(key, topic);
    }
  }

  let assignedLinks = 0;
  const assignedWordKeys = new Set();
  const matchedTopicKeys = new Set();
  const unmatchedSourceWords = new Set();
  const unmatchedTopicNames = new Set();

  for (const row of rows) {
    const tKey = normalizeTopicKey(row?.topic ?? row?.topicName ?? row?.name);
    const wKey = normalizeWordKey(row?.word ?? row?.en ?? row?.english);
    if (!tKey || !wKey) continue;
    const topic = topicByKey.get(tKey);
    if (!topic) {
      unmatchedTopicNames.add(String(row?.topic ?? ''));
      continue;
    }
    matchedTopicKeys.add(tKey);
    const item = vocabByKey.get(wKey);
    if (!item) {
      unmatchedSourceWords.add(wKey);
      continue;
    }
    const set = wordSets.get(topic);
    if (!set.has(wKey)) {
      set.set(wKey, item.word);
      assignedLinks += 1;
    }
    assignedWordKeys.add(wKey);
  }

  const hydratedTopics = topics.map(topic => ({
    ...topic,
    words: [...(wordSets.get(topic)?.values() || [])]
  }));

  return {
    topics: hydratedTopics,
    report: {
      sourceRows: rows.length,
      matchedTopics: matchedTopicKeys.size,
      assignedLinks,
      uniqueAssignedWords: assignedWordKeys.size,
      unmatchedSourceWords: unmatchedSourceWords.size,
      unmatchedTopicNames: [...unmatchedTopicNames].filter(Boolean),
      emptyTopics: hydratedTopics.filter(t => !(t.words || []).length).map(t => t.nameVi || t.name || String(t.id))
    }
  };
}

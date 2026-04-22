import re
from collections import Counter

STOPWORDS = {
    "the", "is", "in", "and", "of", "to", "a", "for", "with", "on", "as",
    "an", "by", "it", "from", "that", "this", "are", "be", "or", "at"
}

def summarize_text(text: str, max_sentences: int = 3):
    if not text or not text.strip():
        return ""

    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if len(sentences) <= max_sentences:
        return text.strip()

    words = re.findall(r'\w+', text.lower())
    filtered_words = [word for word in words if word not in STOPWORDS]
    freq = Counter(filtered_words)

    sentence_scores = {}
    for sentence in sentences:
        sentence_words = re.findall(r'\w+', sentence.lower())
        score = sum(freq[word] for word in sentence_words if word in freq)
        sentence_scores[sentence] = score

    ranked = sorted(sentence_scores, key=sentence_scores.get, reverse=True)
    selected = ranked[:max_sentences]

    ordered_summary = [s for s in sentences if s in selected]
    return " ".join(ordered_summary)
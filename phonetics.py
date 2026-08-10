import cmudict
from g2p_en import G2p

_g2p = G2p()

phoneme_data = {

    # Vowels
    "AA": {"ipa": "ɑ", "stressed": "ah", "unstressed": "uh", "type": "vowel"},
    "AE": {"ipa": "æ", "stressed": "a", "unstressed": "uh", "type": "vowel"},
    "AH": {"ipa": "ʌ", "stressed": "uh", "unstressed": "uh", "type": "vowel"},
    "AO": {"ipa": "ɔː", "stressed": "aw", "unstressed": "uh", "type": "vowel"},
    "EH": {"ipa": "e", "stressed": "eh", "unstressed": "uh", "type": "vowel"},
    "ER": {"ipa": "ɝ", "stressed": "er", "unstressed": "er", "type": "vowel"},
    "IH": {"ipa": "ɪ", "stressed": "ih", "unstressed": "ih", "type": "vowel"},
    "IY": {"ipa": "iː", "stressed": "ee", "unstressed": "ih", "type": "vowel"},
    "UH": {"ipa": "ʊ", "stressed": "uh", "unstressed": "uh", "type": "vowel"},
    "UW": {"ipa": "uː", "stressed": "oo", "unstressed": "oo", "type": "vowel"},

    # Diphthongs
    "AW": {"ipa": "aʊ", "stressed": "ow", "unstressed": "ow", "type": "diphthong"},
    "AY": {"ipa": "aɪ", "stressed": "eye", "unstressed": "eye", "type": "diphthong"},
    "EY": {"ipa": "eɪ", "stressed": "ay", "unstressed": "ay", "type": "diphthong"},
    "OW": {"ipa": "oʊ", "stressed": "oh", "unstressed": "oh", "type": "diphthong"},
    "OY": {"ipa": "ɔɪ", "stressed": "oy", "unstressed": "oy", "type": "diphthong"},

    # Semivowels
    "R": {"ipa": "r", "stressed": "r", "unstressed": "r", "type": "semivowel"},
    "W": {"ipa": "w", "stressed": "w", "unstressed": "w", "type": "semivowel"},
    "Y": {"ipa": "j", "stressed": "y", "unstressed": "y", "type": "semivowel"},

    # Consonants
    "B": {"ipa": "b", "stressed": "b", "unstressed": "b", "type": "consonant"},
    "CH": {"ipa": "tʃ", "stressed": "ch", "unstressed": "ch", "type": "consonant"},
    "D": {"ipa": "d", "stressed": "d", "unstressed": "d", "type": "consonant"},
    "DH": {"ipa": "ð", "stressed": "th", "unstressed": "th", "type": "consonant"},
    "F": {"ipa": "f", "stressed": "f", "unstressed": "f", "type": "consonant"},
    "G": {"ipa": "ɡ", "stressed": "g", "unstressed": "g", "type": "consonant"},
    "HH": {"ipa": "h", "stressed": "h", "unstressed": "h", "type": "consonant"},
    "JH": {"ipa": "dʒ", "stressed": "j", "unstressed": "j", "type": "consonant"},
    "K": {"ipa": "k", "stressed": "k", "unstressed": "k", "type": "consonant"},
    "L": {"ipa": "l", "stressed": "l", "unstressed": "l", "type": "consonant"},
    "M": {"ipa": "m", "stressed": "m", "unstressed": "m", "type": "consonant"},
    "N": {"ipa": "n", "stressed": "n", "unstressed": "n", "type": "consonant"},
    "NG": {"ipa": "ŋ", "stressed": "ng", "unstressed": "ng", "type": "consonant"},
    "P": {"ipa": "p", "stressed": "p", "unstressed": "p", "type": "consonant"},
    "S": {"ipa": "s", "stressed": "s", "unstressed": "s", "type": "consonant"},
    "SH": {"ipa": "ʃ", "stressed": "sh", "unstressed": "sh", "type": "consonant"},
    "T": {"ipa": "t", "stressed": "t", "unstressed": "t", "type": "consonant"},
    "TH": {"ipa": "θ", "stressed": "th", "unstressed": "th", "type": "consonant"},
    "V": {"ipa": "v", "stressed": "v", "unstressed": "v", "type": "consonant"},
    "Z": {"ipa": "z", "stressed": "z", "unstressed": "z", "type": "consonant"},
    "ZH": {"ipa": "ʒ", "stressed": "zh", "unstressed": "zh", "type": "consonant"},
}


def split_stress(phoneme):
    if phoneme[-1] in "012":
        return phoneme[:-1], phoneme[-1]
    return phoneme, None

def process_sentence_stream(sentence, dictionary):
    """
    Mode B: concatenates all words' phonemes into one stream, then reverses
    the whole thing as a single unit. Word boundaries are lost in the output —
    this treats the sentence as one long pronunciation, not a sequence of words.
    """
    words = [w.strip(".,!?;:") for w in sentence.lower().split()]
    words = [w for w in words if w]

    all_phonemes = []
    sources = []

    for word in words:
        phonemes, source = get_phonemes(word, dictionary)
        all_phonemes.extend(phonemes)
        sources.append((word, source))

    if not all_phonemes:
        return None

    reversed_phonemes = all_phonemes[::-1]

    original_ipa = [get_ipa(split_stress(p)[0]) for p in all_phonemes]
    reverse_ipa = [get_ipa(split_stress(p)[0]) for p in reversed_phonemes]

    approximate_sounds = []
    for i, phoneme in enumerate(reversed_phonemes):
        base_phoneme, stress = split_stress(phoneme)
        spelling = resolve_spelling(base_phoneme, stress, i, len(reversed_phonemes))
        approximate_sounds.append(spelling)

    return {
        "words": words,
        "phonemes": all_phonemes,
        "reversed_phonemes": reversed_phonemes,
        "original_ipa": original_ipa,
        "reverse_ipa": reverse_ipa,
        "pronunciation": "-".join(approximate_sounds),
        "sources": sources,
    }

def print_stream_result(sentence, result):
    print()
    print("Original sentence")
    print(sentence)

    print()
    print("Combined phonemes")
    print(" ".join(result["phonemes"]))

    print()
    print("Combined IPA")
    print(" ".join(result["original_ipa"]))

    print()
    print("Reversed phoneme stream")
    print(" ".join(result["reversed_phonemes"]))

    print()
    print("Reversed IPA")
    print(" ".join(result["reverse_ipa"]))

    print()
    print("Final approximate pronunciation")
    print(result["pronunciation"])

    print()
    print("Sources")
    for word, source in result["sources"]:
        print(f"  {word}: {source}")

def resolve_spelling(base_phoneme, stress, position, sequence_length):
    """
    Picks a spelling for one phoneme, applying transition rules first
    and falling back to the plain stressed/unstressed spelling.
    """
    entry = phoneme_data.get(base_phoneme)

    if entry is None:
        return f"[{base_phoneme}]"

    # Transition rule: diphthong, stressed, sequence-initial (front-load the glide)
    if (
        entry["type"] == "diphthong"
        and stress == "1"
        and position == 0
        and sequence_length > 1
    ):
        glide_lead = {
            "OW": "wuh",
            "AY": "yai",
            "EY": "yay",
            "AW": "wow",
            "OY": "yoy"
        }
        if base_phoneme in glide_lead:
            return glide_lead[base_phoneme]

    is_stressed = stress in ("1", "2")
    return entry["stressed"] if is_stressed else entry["unstressed"]


def get_ipa(base_phoneme):
    entry = phoneme_data.get(base_phoneme)
    return entry["ipa"] if entry else f"[{base_phoneme}]"


def get_phonemes(word, dictionary):
    """Returns (phonemes, source). Tries CMUdict first, falls back to G2P prediction."""
    if word in dictionary:
        return dictionary[word][0], "CMUdict"
    else:
        predicted = [p for p in _g2p(word) if p.strip() and p not in (",", ".")]
        return predicted, "G2P prediction"


def process_word(word, dictionary):
    phonemes, source = get_phonemes(word, dictionary)

    if not phonemes:
        return None

    reversed_phonemes = phonemes[::-1]

    original_ipa = [get_ipa(split_stress(p)[0]) for p in phonemes]
    reverse_ipa = [get_ipa(split_stress(p)[0]) for p in reversed_phonemes]

    approximate_sounds = []
    for i, phoneme in enumerate(reversed_phonemes):
        base_phoneme, stress = split_stress(phoneme)
        spelling = resolve_spelling(base_phoneme, stress, i, len(reversed_phonemes))
        approximate_sounds.append(spelling)

    return {
        "phonemes": phonemes,
        "reversed_phonemes": reversed_phonemes,
        "original_ipa": original_ipa,
        "reverse_ipa": reverse_ipa,
        "pronunciation": "-".join(approximate_sounds),
        "source": source,
    }


def process_sentence(sentence, dictionary):
    """Word-preserving mode: each word's phonemes reversed independently, word order kept."""
    words = sentence.lower().split()
    results = []
    for word in words:
        cleaned = word.strip(".,!?;:")
        if not cleaned:
            continue
        result = process_word(cleaned, dictionary)
        results.append((cleaned, result))
    return results


def print_result(word, result):
    print()
    print("Original")
    print(word)

    print()
    print("Phonemes")
    print(" ".join(result["phonemes"]))

    print()
    print("IPA")
    print(" ".join(result["original_ipa"]))

    print()
    print("Reverse phonemes")
    print(" ".join(result["reversed_phonemes"]))

    print()
    print("Reverse IPA")
    print(" ".join(result["reverse_ipa"]))

    print()
    print("Approximate pronunciation")
    print(result["pronunciation"])

    print()
    print("Source")
    print(result["source"])


if __name__ == "__main__":

    dictionary = cmudict.dict()

    text = input("Enter a word or sentence: ").lower()

    if len(text.split()) == 1:
        result = process_word(text, dictionary)
        if result is not None:
            print_result(text, result)
        else:
            print(f"'{text}' could not be processed.")
    else:
        mode = input("Mode — (w)ord-preserving or (s)tream reversal? ").strip().lower()

        if mode == "s":
            result = process_sentence_stream(text, dictionary)
            if result is not None:
                print_stream_result(text, result)
            else:
                print("Could not process this sentence.")
        else:
            results = process_sentence(text, dictionary)
            for word, result in results:
                if result is not None:
                    print_result(word, result)
                else:
                    print(f"\n'{word}' could not be processed.")
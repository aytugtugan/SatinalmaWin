import json
from collections import Counter

path = 'masaustu/ocak_2026_data.json'

with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

mapping = {
    'sitrik asit': 'SİTRİK ASİT',
    'strk ast': 'SİTRİK ASİT',
    'strk': 'SİTRİK ASİT',

    'plastik ambalaj': 'PLASTİK AMBALAJ',
    'plastk ambalaj': 'PLASTİK AMBALAJ',
    'plastk': 'PLASTİK AMBALAJ',

    'mekanik bakım onarım': 'MEKANİK BAKIM ONARIM',
    'mekank bakım onarım': 'MEKANİK BAKIM ONARIM',
    'mekank bakim onarim': 'MEKANİK BAKIM ONARIM',
    'mekank': 'MEKANİK BAKIM ONARIM',

    'elektrik malzemeler': 'ELEKTRİK MALZEMELERİ',
    'elektrk malzemeler': 'ELEKTRİK MALZEMELERİ',
    'elektrk malzemeleri': 'ELEKTRİK MALZEMELERİ',

    'matbaa işler': 'MATBAA İŞLERİ',
    'matbaa şler': 'MATBAA İŞLERİ',
    'matbaa ş': 'MATBAA İŞLERİ',

    'teneke': 'TENEKE KUTU',
    'teneke kutu': 'TENEKE KUTU',

    'kirtasye': 'KIRTASİYE',
    'kırtasye': 'KIRTASİYE',

    'tesisat grubu': 'TESİSAT GRUBU',
    'tessat grubu': 'TESİSAT GRUBU',
    'tessat': 'TESİSAT GRUBU',
}

# helper normalize
import re

def norm(s):
    if not isinstance(s, str):
        return ''
    s2 = s.strip().lower()
    s2 = re.sub(r'[\u00A0\s]+', ' ', s2)
    return s2

changes = []
counts = Counter()

for i, item in enumerate(data):
    if not isinstance(item, dict):
        continue
    key = 'MASRAF_MERKEZI'
    if key in item:
        orig = item[key]
        n = norm(orig)
        replaced = None
        # exact mapping by normalized string
        if n in mapping:
            new = mapping[n]
            if orig != new:
                item[key] = new
                changes.append((i, orig, new))
                counts[new] += 1
        else:
            # try substring matches
            for k, v in mapping.items():
                if k in n:
                    if item[key] != v:
                        item[key] = v
                        changes.append((i, orig, v))
                        counts[v] += 1
                    break

            # if still not replaced, look for mapping keywords in other text fields (e.g., ACIKLAMA)
            if item.get(key) == orig:
                other_fields = ['ACIKLAMA', 'TALEP_ACIKLAMA', 'SIPARIS_MALZEME']
                for field in other_fields:
                    val = item.get(field)
                    if isinstance(val, str):
                        nv = norm(val)
                        for k, v in mapping.items():
                            if k in nv:
                                if item[key] != v:
                                    item[key] = v
                                    changes.append((i, orig, v))
                                    counts[v] += 1
                                break
                        if item.get(key) != orig:
                            break

if changes:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print('Replacements:', len(changes))
for c in Counter([c[2] for c in changes]).items():
    print(c[0], c[1])
# print first 10 changes for inspection
for ch in changes[:10]:
    print(ch)

#!/usr/bin/env python3
"""Génère resources/js/landing/content/legal-docs.js à partir des documents de resources/legal/*.md.

Usage : python3 scripts/build-legal.py
Les documents restent la source : modifiez le .md puis relancez le script.

Structure produite par document : title, updated, meta (lignes d'en-tête), intro, sections[{ id, title, blocks }]
blocs : { p } paragraphe · { h } sous-titre · { ul } liste · { qa: [q, a] } question/réponse · { table } tableau.
Les adresses e-mail deviennent {mail:clé} : la page les affiche « nom[a]zurumi.com » (voir ui/ZMail.vue).
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'resources/legal'
OUT = ROOT / 'resources/js/landing/content/legal-docs.js'

DOCS = {  # id → fichier source
    'terms': 'conditions.md',
    'privacy': 'confidentialite.md',
    'cookies': 'cookies.md',
    'whistleblowing': 'denonciation.md',
    'faq': 'faq.md',
}
TITLES = {  # titres d'affichage (les sources sont en capitales)
    'terms': 'Conditions générales d’utilisation et de vente (CGU / CGV)',
    'privacy': 'Politique de confidentialité',
    'cookies': 'Politique des cookies',
    'whistleblowing': 'Politique de dénonciation & divulgation des risques',
    'faq': 'Foire aux questions (FAQ)',
}
MAILS = {'support': 'support', 'compliance': 'compliance', 'signalement': 'report', 'whistleblowing': 'report'}

# Tableau des cookies (image dans le document d'origine, retranscrit ici).
TABLES = {
    'cookies': {
        'head': ['Nom du cookie (exemple)', 'Fournisseur', 'Catégorie', 'Finalité', 'Durée'],
        'rows': [
            ['session_id', 'Zurumi (serveur)', 'Essentiel', 'Maintien de la session utilisateur', 'Session'],
            ['csrf_token', 'Zurumi', 'Essentiel', 'Sécurité des formulaires (anti-CSRF)', 'Session'],
            ['_ga, _gid', 'Google Analytics (ou équivalent)', 'Analytics', 'Mesure d’audience (anonymisée)', '24 mois / 24 h'],
            ['_gat', 'Google Analytics', 'Analytics', 'Limitation du taux de requêtes', '1 minute'],
            ['cookie_consent', 'Zurumi', 'Préférences', 'Mémorise vos choix de consentement', '12 mois'],
            ['jwt_token', 'Zurumi', 'Essentiel', 'Authentification sécurisée', 'Session / longue durée selon paramètre'],
            ['pp_provider', 'Prestataire de paiement', 'Fonctionnel', 'Facilite les paiements (mobile money / banque)', 'Selon prestataire'],
            ['KYC widget', 'Fournisseur KYC', 'Sécurité / Conformité', 'Intégration de la vérification d’identité (token)', 'Selon prestataire'],
            ['ad_id', 'Réseau publicitaire tiers', 'Marketing', 'Ciblage publicitaire', '6 – 12 mois'],
        ],
    },
}


def clean(text):
    text = re.sub(r'\[\*\*([^\]]*?)\*\*\]\(mailto:[^)]*\)', r'\1', text)
    text = re.sub(r'([\w.]*)\[(@[^\]]*)\]\(mailto:[^)]*\)', r'\1\2', text)
    text = re.sub(r'\[([^\]]*)\]\(mailto:[^)]*\)', r'\1', text)
    text = text.replace('**', '')
    text = re.sub(r'\\([.=>_\[\]\-*()#+!])', r'\1', text)
    text = re.sub(r'\b([a-z]+)@zurumi\.com\b', lambda m: '{mail:%s}' % MAILS.get(m.group(1), m.group(1)), text)
    return re.sub(r'\s+', ' ', text).strip()


def slug(text):
    s = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:48]


SECTION = re.compile(r'^\*\*(?:\d+\\?\.\s*|[A-Q]\s+—\s+)(.+?)\*\*\s*$')
ANNEX = re.compile(r'^\*{0,2}(Annexes?\b.+?)\*{0,2}\s*$')
SUBHEAD = re.compile(r'^(?:\d+\.\d+\s+|[A-H]\.\s+)(\S.*)$')
INLINE_HEAD = re.compile(r'^\*\*(.+?)\*\*\s*$')
META = re.compile(r'^(Date d’entrée en vigueur|Dernière mise à jour|Version|Société|Siège|Adresse|Contact)')


def parse(doc_id, path):
    raw = path.read_text(encoding='utf-8').replace('\r', '')
    # « Q… — question  \nR : réponse » : on garde le couple ensemble.
    paras = [p for p in re.split(r'\n\s*\n', raw) if p.strip()]
    doc = {'title': '', 'updated': '', 'meta': [], 'intro': [], 'sections': []}
    cur = None

    def add(block):
        if cur is None:
            if 'p' in block:
                doc['intro'].append(block['p'])
        else:
            cur['blocks'].append(block)

    for para in paras:
        lines = [l.rstrip('\t') for l in para.split('\n')]
        first = lines[0].strip()
        if not doc['title']:
            doc['title'] = clean(first).capitalize() if first.isupper() or first.replace('*', '').isupper() else clean(first)
            rest = [l for l in lines[1:] if l.strip()]
            for l in rest:
                c = clean(l)
                m = re.match(r'^(?:Date d’entrée en vigueur|Dernière mise à jour)\s*:\s*(.+)$', c)
                if m:
                    doc['updated'] = m.group(1)
                else:
                    (doc['meta'] if META.match(c) else doc['intro']).append(c)
            continue
        if cur is None and META.match(clean(first)):
            for l in lines:
                c = clean(l)
                if not c:
                    continue
                m = re.match(r'^(?:Date d’entrée en vigueur|Dernière mise à jour)\s*:\s*(.+)$', c)
                if m:
                    doc['updated'] = m.group(1)
                elif re.match(r'^Version\s*:', c) and '—' in c:
                    v, d = c.split('—', 1)
                    doc['meta'].append(v.strip())
                    doc['updated'] = re.sub(r'^.*?:\s*', '', d.strip())
                else:
                    doc['meta'].append(c)
            continue
        m = SECTION.match(first) or (ANNEX.match(first) if first.startswith(('**Annexe', 'Annexe')) else None)
        if m:
            title = clean(m.group(1))
            cur = {'id': slug(title), 'title': title, 'blocks': []}
            doc['sections'].append(cur)
            lines = [l for l in lines[1:] if l.strip()]
            if not lines:
                continue
            first = lines[0].strip()
        if cur is None:
            # En-tête : sous-titre, date, société… ligne par ligne
            for l in lines:
                c = clean(l)
                d = re.match(r'^(?:Date d’entrée en vigueur|Dernière mise à jour)\s*:\s*(.+)$', c)
                if d:
                    doc['updated'] = d.group(1)
                elif c:
                    (doc['meta'] if META.match(c) else doc['intro']).append(c)
            continue
        if re.match(r'^Q\d+\s+—', first):
            q = clean(re.sub(r'^Q\d+\s+—\s*', '', first))
            a = clean(re.sub(r'^R\s*:\s*', '', ' '.join(lines[1:])))
            add({'qa': [q, a]})
            continue
        if first == '[[table:cookies]]':
            add({'table': TABLES['cookies']})
            continue
        if clean(first) in ('.', ''):
            continue
        # Liste à puces
        if all(re.match(r'^\s*[-*]\s+', l) for l in lines if l.strip()):
            items = [clean(re.sub(r'^\s*[-*]\s+', '', l)) for l in lines if l.strip()]
            if cur and cur['blocks'] and 'ul' in cur['blocks'][-1]:
                cur['blocks'][-1]['ul'].extend(items)
            else:
                add({'ul': items})
            continue
        # Sous-titre seul (« 3.1 … », « A. … », ou ligne en gras)
        if len(lines) == 1 and (SUBHEAD.match(clean(first)) and len(clean(first)) < 90 or INLINE_HEAD.match(first)):
            add({'h': clean(first)})
            continue
        # Titre en gras suivi d'un texte (« **Comment exercer vos droits ?**  \nEnvoyez… »)
        if INLINE_HEAD.match(lines[0].strip()) and len(lines) > 1:
            add({'h': clean(lines[0])})
            lines = lines[1:]
        # Paragraphe : les retours « deux espaces » séparent des alinéas (3.1., 3.2., …)
        chunks, buf = [], []
        for l in lines:
            buf.append(l)
            if l.endswith('  '):
                chunks.append(' '.join(buf))
                buf = []
        if buf:
            chunks.append(' '.join(buf))
        for c in chunks:
            c = clean(c)
            if c:
                add({'p': c})
    if not doc['updated']:
        doc['updated'] = next((re.sub(r'^.*?:\s*', '', x) for x in doc['meta'] if 'vigueur' in x), '')
    doc['meta'] = [x for x in doc['meta'] if 'vigueur' not in x and 'mise à jour' not in x]
    doc['sections'] = [x for x in doc['sections'] if x['blocks']]  # titres de regroupement vides
    doc['title'] = TITLES[doc_id]
    return doc


def main():
    docs = {k: parse(k, SRC / f) for k, f in DOCS.items()}
    body = json.dumps(docs, ensure_ascii=False, indent=1)
    OUT.write_text(
        '// GÉNÉRÉ par scripts/build-legal.py à partir de resources/legal/*.md — ne pas modifier à la main.\n'
        '// Documents officiels (FR). {mail:clé} = adresse protégée (content/data.js → emails).\n'
        f'export default {body};\n',
        encoding='utf-8',
    )
    for k, d in docs.items():
        n = sum(len(s['blocks']) for s in d['sections'])
        print(f"{k}: « {d['title']} » — {d['updated']} — {len(d['sections'])} sections, {n} blocs, meta={d['meta']}")


if __name__ == '__main__':
    main()

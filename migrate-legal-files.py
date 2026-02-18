#!/usr/bin/env python3
"""
Migrar ficheiros do Supabase Storage para o servidor Legal/.

Uso:
  SUPABASE_SERVICE_KEY="eyJ..." python3 migrate-legal-files.py [--dry-run]

Requisito: service_role key do Supabase (para aceder ao Storage e actualizar registos).
Obtê-la no Supabase Dashboard > Settings > API > service_role key.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from datetime import datetime

SUPABASE_URL = "https://zyziolikudoczsthyoja.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
LEGAL_BASE = Path("/root/Robsonway-Research/Legal")
DRY_RUN = "--dry-run" in sys.argv

if not SUPABASE_KEY:
    print("ERRO: Definir SUPABASE_SERVICE_KEY como variavel de ambiente.")
    print('  SUPABASE_SERVICE_KEY="eyJ..." python3 migrate-legal-files.py')
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def supabase_get(endpoint, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params, safe="*,.()")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def supabase_patch(endpoint, data, match_params):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}?{urllib.parse.urlencode(match_params, safe='*,.()')}"
    body = json.dumps(data).encode()
    headers = {**HEADERS, "Prefer": "return=minimal"}
    req = urllib.request.Request(url, data=body, headers=headers, method="PATCH")
    with urllib.request.urlopen(req) as resp:
        return resp.status


def storage_download(bucket, file_path):
    encoded = urllib.parse.quote(file_path, safe="/")
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{encoded}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def get_next_number(folder_path):
    if not folder_path.exists():
        return 1
    max_num = 0
    for f in folder_path.iterdir():
        m = re.match(r"^(\d+)\.", f.name)
        if m:
            num = int(m.group(1))
            if num > max_num:
                max_num = num
    return max_num + 1


MONTH_NAMES_PT = [
    "", "01 Janeiro", "02 Fevereiro", "03 Março", "04 Abril",
    "05 Maio", "06 Junho", "07 Julho", "08 Agosto",
    "09 Setembro", "10 Outubro", "11 Novembro", "12 Dezembro"
]


def get_year_month_subfolder(date_str):
    """Returns the year/month subfolder path (e.g. '2025/12 Dezembro 2025')."""
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        month_name = MONTH_NAMES_PT[dt.month]
        return f"{dt.year}/{month_name} {dt.year}"
    except ValueError:
        return None


def format_filename(title, date_str, ext, seq_num):
    words = title.split()[:5]
    desc = " ".join(words)
    date_part = ""
    if date_str:
        try:
            dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
            date_part = f" ({dt.strftime('%d-%m-%Y')})"
        except ValueError:
            pass
    return f"{seq_num}. {desc}{date_part}{ext}"


def main():
    print("=" * 60)
    print("Migracao: Supabase Storage -> Servidor Legal/")
    if DRY_RUN:
        print("*** DRY RUN - nenhum ficheiro sera movido ***")
    print("=" * 60)

    # 1. Get folder mappings
    print("\n[1] Carregar mapeamentos caso -> pasta...")
    mappings = supabase_get("legal_case_folders", {"select": "*"})
    case_to_folders = {}
    for m in mappings:
        if m["case_id"] not in case_to_folders:
            case_to_folders[m["case_id"]] = []
        case_to_folders[m["case_id"]].append(m["folder_path"])
    print(f"    {len(mappings)} mapeamentos para {len(case_to_folders)} casos")

    # 2. Get documents with attachments
    print("\n[2] Carregar documentos com attachments...")
    docs = supabase_get("legal_documents", {
        "select": "id,title,created_date,case_id,attachment_url,attachments,server_path",
        "or": "(attachment_url.not.is.null,attachments.not.is.null)",
        "server_path": "is.null",
    })
    print(f"    {len(docs)} documentos com attachments para migrar")

    if not docs:
        print("\nNada para migrar.")
        return

    # 3. Process each document
    migrated = 0
    skipped_no_mapping = []
    errors = []

    for i, doc in enumerate(docs, 1):
        doc_id = doc["id"]
        title = doc["title"]
        created_date = doc["created_date"]
        case_id = doc.get("case_id")

        attachments = doc.get("attachments") or []
        if not attachments and doc.get("attachment_url"):
            attachments = [doc["attachment_url"]]

        if not case_id or case_id not in case_to_folders:
            skipped_no_mapping.append({"id": doc_id, "title": title, "case_id": case_id})
            continue

        target_folder = case_to_folders[case_id][0]
        sub = get_year_month_subfolder(created_date)
        if sub:
            target_path = LEGAL_BASE / target_folder / sub
        else:
            target_path = LEGAL_BASE / target_folder

        rel_dest = f"{target_folder}/{sub}" if sub else target_folder
        print(f"\n[{i}/{len(docs)}] {title}")
        print(f"    Destino: {rel_dest}/")

        for att_idx, att_path in enumerate(attachments):
            file_path = att_path
            if "legal-documents/" in file_path:
                file_path = file_path.split("legal-documents/", 1)[1]

            original_name = file_path.split("/")[-1]
            # Strip UUID prefix
            uuid_stripped = re.sub(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_", "", original_name)
            ext = Path(uuid_stripped).suffix or Path(original_name).suffix or ".pdf"

            seq_num = get_next_number(target_path)
            new_name = format_filename(title, created_date, ext, seq_num)
            dest_file = target_path / new_name
            server_path = f"{rel_dest}/{new_name}"

            print(f"    [{att_idx+1}/{len(attachments)}] {original_name}")
            print(f"    -> {new_name}")

            if DRY_RUN:
                print(f"    [DRY RUN] Seria guardado em: {dest_file}")
                continue

            try:
                file_data = storage_download("legal-documents", file_path)
                target_path.mkdir(parents=True, exist_ok=True)
                dest_file.write_bytes(file_data)
                print(f"    Guardado ({len(file_data)} bytes)")

                # Update only the first attachment's server_path
                if att_idx == 0:
                    supabase_patch("legal_documents", {
                        "server_path": server_path,
                    }, {"id": f"eq.{doc_id}"})
                    print(f"    DB actualizada: server_path={server_path}")

                migrated += 1
            except urllib.error.HTTPError as e:
                error_msg = f"HTTP {e.code}: {e.read().decode()[:200]}"
                print(f"    ERRO: {error_msg}")
                errors.append({"id": doc_id, "title": title, "error": error_msg})
            except Exception as e:
                print(f"    ERRO: {e}")
                errors.append({"id": doc_id, "title": title, "error": str(e)})

    # Summary
    print("\n" + "=" * 60)
    print("RESUMO DA MIGRACAO")
    print("=" * 60)
    print(f"Total documentos:      {len(docs)}")
    print(f"Migrados com sucesso:  {migrated}")
    print(f"Sem mapeamento:        {len(skipped_no_mapping)}")
    print(f"Erros:                 {len(errors)}")

    if skipped_no_mapping:
        print("\nDocumentos sem mapeamento de pasta:")
        for s in skipped_no_mapping:
            print(f"  - {s['title']} (case_id: {s['case_id']})")

    if errors:
        print("\nErros:")
        for e in errors:
            print(f"  - {e['title']}: {e['error']}")


if __name__ == "__main__":
    main()

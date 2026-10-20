"""Create a local Windows source bundle; does not publish or contact services."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json, sys
root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root.parent / 'hitoyo-edo-v2-learning-windows.zip'
manifest = {}
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob('*')):
        relative = file.relative_to(root)
        if not file.is_file() or any(p in ('.git', 'node_modules', 'artifacts', 'releases', '__pycache__') for p in relative.parts):
            continue
        if file.resolve() == out.resolve():
            continue
        data = file.read_bytes()
        archive.writestr('hitoyo-edo-v2-learning/' + relative.as_posix(), data)
        manifest[relative.as_posix()] = hashlib.sha256(data).hexdigest()
    archive.writestr('hitoyo-edo-v2-learning/release-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
with ZipFile(out) as archive:
    assert archive.testzip() is None
    for file, digest in manifest.items():
        assert hashlib.sha256(archive.read('hitoyo-edo-v2-learning/' + file)).hexdigest() == digest
print(f'Verified {len(manifest)} files: {out} ({out.stat().st_size:,} bytes)')

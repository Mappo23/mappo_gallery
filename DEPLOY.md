# Deploying FILM OS to Namecheap (cPanel + PHP 8.2 + MySQL)

The app is now a static front-end (`index.html`, `css/`, `js/`) talking to a small
PHP API (`api/`) backed by MySQL. Photos are stored as files in `uploads/`.

## 0. What's public vs secret

- **Committed to GitHub:** everything except `api/config.php` and the uploaded photos.
- **NOT committed** (see `.gitignore`): `api/config.php` (DB creds + owner password
  hash) and `uploads/*` (the actual images). You create `config.php` on the server.

## 1. Create the MySQL database (cPanel → *MySQL® Databases*)

1. **Create New Database** — e.g. `mappo` → full name becomes `cpanelusr_mappo`.
2. **Add New User** — e.g. `mappo` with a strong password → `cpanelusr_mappo`.
3. **Add User To Database** → grant **ALL PRIVILEGES**.
4. Note the three values: database name, user name, user password.

## 2. Upload the files

Put the project inside your domain's document root (usually `public_html/`), so you have:

```
public_html/
  index.html  css/  js/  serve.py  README.md
  api/        uploads/
```

Options: **cPanel → File Manager** (upload a zip and Extract), or FTP, or — cleanest —
deploy from GitHub. The repo already matches this layout.

## 3. Create `api/config.php` on the server

Copy `api/config.example.php` → `api/config.php` (File Manager: right-click → Copy),
then edit it. It should read:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpanelusr_mappo');   // from step 1
define('DB_USER', 'cpanelusr_mappo');
define('DB_PASS', 'your-db-password');

// Owner password "pepe_nero" — already generated for you:
define('OWNER_SALT_HEX', 'c41ca5a72555d2761aaa09e026f85416');
define('OWNER_ITERS',    200000);
define('OWNER_HASH_HEX', '20ab620f58c98932de1f53df17b347d38399be802da13c8f015e578acd69aff8');
```

The DB tables (`photos`, `kv`) are created automatically on first API call — nothing
to import.

### Changing the owner password later

Run this locally (needs Python 3, no libraries) and paste the three values into
`config.php`:

```bash
python3 - <<'EOF'
import hashlib, os, binascii
pw = b'YOUR_NEW_PASSWORD'
salt = os.urandom(16); iters = 200000
dk = hashlib.pbkdf2_hmac('sha256', pw, salt, iters)
print("OWNER_SALT_HEX =", binascii.hexlify(salt).decode())
print("OWNER_ITERS    =", iters)
print("OWNER_HASH_HEX =", binascii.hexlify(dk).decode())
EOF
```

## 4. Make `uploads/` writable

The PHP process must be able to write photos there. In File Manager, select the
`uploads/` folder → **Permissions** → `0755` (owner write). If uploads fail with a
500, try `0775`.

## 5. Raise the PHP upload limits (phone photos are big)

**cPanel → MultiPHP INI Editor** → pick your domain → set:

- `upload_max_filesize` = `20M`
- `post_max_size` = `25M`
- `memory_limit` = `256M`  (image decoding headroom)

(PHP is already on **8.2** per MultiPHP Manager — good.)

## 6. Turn on HTTPS

**cPanel → SSL/TLS Status** → **Run AutoSSL** for your domain. Sessions are set with
the `Secure` flag over HTTPS, so always use `https://`.

## 7. Point your domain

If the domain's nameservers are Namecheap's default (BasicDNS) and the site lives on
this hosting account, it already resolves. Otherwise set an **A record** for `@` (and
`www`) to the server IP shown in cPanel → *Server Information*. DNS can take up to a
few hours.

## 8. Smoke test

1. Visit `https://yourdomain/` — the desktop loads, gallery empty, **no edit buttons**
   (you're a visitor).
2. Visit `https://yourdomain/api/me.php` — should return `{"owner":false}` (confirms
   PHP + DB are wired; if you see PHP source or a 500, fix that first).
3. **Triple-click the FILM OS logo** (bottom-left) → enter `pepe_nero`. Toast says
   `UNLOCKED ✓` and the edit controls appear.
4. Open a Trip post → **EDIT** → **[ + FILM ]**, pick a photo. It uploads; reload the
   page in another browser (logged out) and the photo is still there. 🎉

## Notes

- **Real auth now.** Writes (`POST`/`PATCH`/`DELETE`) require the owner session
  server-side — a visitor cannot upload or edit even if they poke the API directly.
- The hidden client-side gating (`.owner-only`) is just UX; the server is the gate.
- Keep using `save.sh` / GitHub for the code. The server is the deploy target + data
  store; photos live only on the server (and in your camera roll), not in git.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { CyberButton, DataPanel, MetricCard, StatusIndicator } from "@/components/kit/primitives";
import { TerminalWindow, LogLine } from "@/components/kit/TerminalWindow";
import type { StoredFile } from "@/types";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "File Vault — ArcPay Agent" },
      {
        name: "description",
        content:
          "Upload and preserve original project files in the ArcPay Agent vault — binaries are stored byte-for-byte with their metadata indexed.",
      },
      { property: "og:title", content: "File Vault — ArcPay Agent" },
      { property: "og:description", content: "Original-file preservation for brand and project assets." },
      { property: "og:url", content: "/files" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/files" }],
  }),
  component: FilesPage,
});

const BUCKET = "apa-files";

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function FilesPage() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [logs, setLogs] = useState<{ channel: string; message: string; at: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const log = (channel: string, message: string) =>
    setLogs((l) => [...l, { channel, message, at: new Date().toTimeString().slice(0, 8) }].slice(-40));

  const load = async () => {
    const { data, error } = await supabase
      .from("file_uploads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      log("ERROR", error.message);
      return;
    }
    setFiles((data ?? []) as StoredFile[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    for (const file of Array.from(fileList)) {
      const ext = file.name.includes(".") ? file.name.split(".").pop()! : null;
      const path = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
      log("SYSTEM", `Uploading ${file.name} (${fmtSize(file.size)})...`);
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) {
        log("ERROR", `${file.name}: ${upErr.message}`);
        continue;
      }
      const { error: dbErr } = await supabase.from("file_uploads").insert({
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        extension: ext,
        size_bytes: file.size,
        storage_path: path,
      });
      if (dbErr) {
        log("ERROR", `${file.name}: ${dbErr.message}`);
        continue;
      }
      log("RESOURCE", `${file.name} preserved byte-for-byte at ${path}`);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    void load();
  };

  const download = async (f: StoredFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.storage_path, 60);
    if (error || !data) {
      log("ERROR", error?.message ?? "Could not create download link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    log("SYSTEM", `Signed link issued for ${f.filename} (60s)`);
  };

  const totalBytes = files.reduce((s, f) => s + f.size_bytes, 0);

  return (
    <PageShell
      eyebrow="APA://FILES"
      title="File Vault"
      description="Upload original project files. Binaries are stored exactly as provided — no re-encoding, no compression — with filename, MIME type, extension and size indexed for retrieval."
      wide
      actions={
        <>
          <CyberButton size="sm" variant="primary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "UPLOADING..." : "+ UPLOAD FILES"}
          </CyberButton>
          <CyberButton size="sm" variant="ghost" onClick={() => void load()}>
            REFRESH INDEX
          </CyberButton>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="Upload files"
        onChange={(e) => void upload(e.target.files)}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="FILES STORED" value={String(files.length)} sub="INDEXED" tone="accent" />
        <MetricCard label="TOTAL SIZE" value={fmtSize(totalBytes)} sub="ORIGINAL BYTES" tone="cyan" />
        <MetricCard label="PRESERVATION" value="EXACT" sub="NO RE-ENCODING" />
        <MetricCard label="ACCESS" value="SIGNED URL" sub="60s EXPIRY" />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
        className="mt-6 grid place-items-center border border-dashed border-border-strong/60 bg-surface/20 px-6 py-12 text-center"
      >
        <div>
          <div className="font-mono text-[12px] tracking-[0.2em] text-accent">DROP FILES HERE</div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Any format. Max 25 MB per file. Stored unmodified.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <DataPanel title="STORED FILES" right={<StatusIndicator tone={busy ? "idle" : "online"} label={busy ? "BUSY" : "READY"} />}>
          {files.length === 0 ? (
            <p className="font-mono text-[12px] text-muted-foreground">VAULT EMPTY — upload a file to begin.</p>
          ) : (
            <ul className="divide-y divide-border">
              {files.map((f) => (
                <li key={f.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[12px] text-silver">{f.filename}</div>
                    <div className="label-mono mt-1 truncate">
                      {f.mime_type} · {fmtSize(f.size_bytes)} · {new Date(f.created_at).toLocaleString()}
                    </div>
                  </div>
                  <CyberButton size="sm" variant="ghost" className="shrink-0" onClick={() => void download(f)}>
                    DOWNLOAD
                  </CyberButton>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>

        <TerminalWindow title="APA://FILES/LOG" mode="LIVE">
          <div className="h-[300px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">NO OPERATIONS THIS SESSION.</p>
            ) : (
              logs.map((l, i) => <LogLine key={i} at={l.at} channel={l.channel} message={l.message} />)
            )}
          </div>
        </TerminalWindow>
      </div>
    </PageShell>
  );
}

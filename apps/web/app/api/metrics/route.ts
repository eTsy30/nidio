import { type NextRequest, NextResponse } from "next/server";

const names = new Set(["LCP", "INP", "CLS", "TTFB", "FCP"]);
const routes = new Set([
  "/",
  "/login",
  "/calendar",
  "/together",
  "/cards",
  "/savings",
  "/savings/:id",
  "/budget",
  "/profile",
  "/more",
  "/space",
  "/finances",
  "other",
]);
let windowStart = Date.now();
let accepted = 0;
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_PERFORMANCE_METRICS !== "1")
    return new NextResponse(null, { status: 204 });
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  if (Date.now() - windowStart > 60_000) {
    windowStart = Date.now();
    accepted = 0;
  }
  if (++accepted > 300) return new NextResponse(null, { status: 429 });
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse(null, { status: 400 });
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1024) {
        await reader.cancel();
        return new NextResponse(null, { status: 413 });
      }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString()) as {
      name?: unknown;
      value?: unknown;
      route?: unknown;
    };
    if (
      typeof body.name !== "string" ||
      !names.has(body.name) ||
      typeof body.route !== "string" ||
      !routes.has(body.route) ||
      typeof body.value !== "number" ||
      !Number.isFinite(body.value) ||
      body.value < 0 ||
      body.value > 3_600_000
    )
      return new NextResponse(null, { status: 400 });
    console.info(
      JSON.stringify({ event: "web_vital", name: body.name, value: body.value, route: body.route }),
    );
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  } finally {
    reader.releaseLock();
  }
}

const GIT_COMMIT =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  "7a2146dc5ddda5c647b7b7d9c21a874efe7c2415";

export async function GET() {
  return Response.json(
    {
      schemaVersion: 1,
      slug: "wisdomdivine-multipu",
      commit: GIT_COMMIT,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}

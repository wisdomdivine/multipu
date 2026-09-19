const GIT_COMMIT =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  "8ad68bf56070c42e1ca0d2dcc07dc7dfc4377a25";

export async function GET() {
  return Response.json(
    {
      schemaVersion: 1,
      slug: "wisdomnova-multipu",
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

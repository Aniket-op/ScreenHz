export const GET = async () => {
  return new Response(JSON.stringify({ message: "Leaderboard API coming soon" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

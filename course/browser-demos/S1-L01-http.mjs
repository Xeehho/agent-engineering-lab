const response = new Response('{"error":"unavailable"}', {
  status: 503,
  headers: { "Content-Type": "application/json" },
});
console.log("status:", response.status);
console.log("ok:", response.ok);
console.log("body:", await response.json());

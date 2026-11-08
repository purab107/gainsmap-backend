import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth/auth.js";
import fp from "fastify-plugin";

/**
 * Fastify plugin: attaches `request.user` and `request.session` if a valid
 * Better Auth session cookie or bearer token is present.
 *
 * Protected routes should use `preHandler: [fastify.authenticate]`.
 *
 * Uses fastify-plugin so the decorator is available in all scopes.
 */
async function _authPlugin(fastify) {
  fastify.decorate("authenticate", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    request.user = session.user;
    request.session = session.session;
  });
}

export const authPlugin = fp(_authPlugin, { name: "auth-plugin" });

/**
 * Catch-all route that forwards every /api/auth/* request to Better Auth.
 * Register this in the Fastify app *before* any authenticated routes.
 */
export async function authRoutes(fastify) {
  fastify.all("/api/auth/*", async (request, reply) => {
    const url = new URL(
      request.url,
      `${request.protocol}://${request.hostname}`
    );

    const req = new Request(url.toString(), {
      method: request.method,
      headers: fromNodeHeaders(request.headers),
      body:
        request.body && !["GET", "HEAD"].includes(request.method)
          ? JSON.stringify(request.body)
          : undefined,
    });

    const response = await auth.handler(req);

    reply.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      reply.header(key, value);
    }

    return reply.send(await response.text());
  });
}

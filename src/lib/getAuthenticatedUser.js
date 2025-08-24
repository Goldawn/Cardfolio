import { auth } from "@/lib/auth";

/**
 * Récupère l'utilisateur authentifié.
 * Si l'utilisateur n'est pas connecté, renvoie `null` ou lance une exception selon le paramètre.
 *
 * @param {Object} options
 * @param {boolean} options.redirect Si true, redirige vers /login en cas d'absence de session.
 * @param {boolean} options.throwError Si true, lance une erreur si pas connecté.
 * @returns {Promise<Object|null>}
 */
export async function getAuthenticatedUser({ redirect = false, throwError = false } = {}) {
  const session = await auth();

  if (!session || !session.user) {
    if (redirect) {
      // Dans un contexte server (page, action, API), tu peux rediriger proprement
      const { redirect } = await import("next/navigation");
      redirect("/login");
    }

    if (throwError) {
      throw new Error("Vous devez être connecté pour accéder à cette ressource.");
    }

    return null;
  }

  return session.user;
}

export async function assertWishlistOwnership(listId) {
  "use server";
  const authed = await getAuthenticatedUser({ throwError: true });
  const owned = await prisma.wishlistList.findFirst({
    where: { id: listId, userId: authed.id },
    select: { id: true },
  });
  if (!owned) {
    throw new Error("Wishlist introuvable ou non autorisée.");
  }
  return owned.id;
}

export async function assertDeckOwnership(targetDeckId) {
  "use server";
  const authed = await getAuthenticatedUser({ throwError: true });
  const owned = await prisma.decklist.findFirst({
    where: { id: targetDeckId, userId: authed.id },
    select: { id: true },
  });
  if (!owned) {
    throw new Error("Deck introuvable ou non autorisé.");
  }
  return owned.id;
}
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface GetAuthenticatedUserOptions {
  redirect?: boolean
  throwError?: boolean
}

/**
 * Récupère l'utilisateur authentifié.
 * Si l'utilisateur n'est pas connecté, renvoie `null` ou lance une exception selon le paramètre.
 */
export async function getAuthenticatedUser({
  redirect = false,
  throwError = false,
}: GetAuthenticatedUserOptions = {}): Promise<any | null> {
  const session = await auth()

  if (!session || !session.user) {
    if (redirect) {
      // Dans un contexte server (page, action, API), tu peux rediriger proprement
      const { redirect } = await import('next/navigation')
      redirect('/login')
    }

    if (throwError) {
      throw new Error(
        'Vous devez être connecté pour accéder à cette ressource.'
      )
    }

    return null
  }

  return session.user
}

export async function assertWishlistOwnership(listId: string): Promise<string> {
  'use server'
  const authed = await getAuthenticatedUser({ throwError: true })
  const owned = await prisma.wishlistList.findFirst({
    where: { id: listId, userId: authed.id },
    select: { id: true },
  })
  if (!owned) {
    throw new Error('Wishlist introuvable ou non autorisée.')
  }
  return owned.id
}

export async function assertDeckOwnership(
  targetDeckId: string
): Promise<string> {
  'use server'
  const authed = await getAuthenticatedUser({ throwError: true })
  const owned = await prisma.decklist.findFirst({
    where: { id: targetDeckId, userId: authed.id },
    select: { id: true },
  })
  if (!owned) {
    throw new Error('Deck introuvable ou non autorisé.')
  }
  return owned.id
}

/**
 * Type de retour standard pour toutes les Server Actions.
 * Union discriminée — vérifie toujours `success` en premier.
 *
 * @example
 * const result = await createCategory(restaurantId, input)
 * if (!result.success) {
 *   toast.error(result.error.message) // result.error.code pour i18n
 *   return
 * }
 * // result.data est typé ici
 *
 * Voir : API_CONTRACTS.md — Type ActionResponse<T>
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }


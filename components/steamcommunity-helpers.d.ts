/**
 * @internal The functions of `steamcommunity/components/helpers` the package uses; `@types/steamcommunity` declares
 * them only as the interface `Helpers`, not as exports of the module.
 */

/** Returns `null` for `EResult.OK`, otherwise an Error named after the EResult with the property `eresult`. */
export function eresultError(eresult: number): (Error & {eresult: number}) | null;

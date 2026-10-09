import {createContext, useContext} from 'react';

/**
 * "Bare" renders drop the background and every purely decorative layer, leaving only
 * the key text and graphics. QA renders it to look for key content inside the
 * platform UI zones.
 */
export const BareContext = createContext(false);
export const useBare = () => useContext(BareContext);

// SubscriptionContext.js
import { createContext, useContext } from 'react';

export const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

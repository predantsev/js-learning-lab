# %%decisionsTitle%%

## %%question1%%

The list request state and the write actions are shared through ReadingListProvider, because the list, the cards and the form all need them; the form draft, the field errors and the compact switch stay local in the component that owns them.

## %%question2%%

readingTypes.ts, readingModel.ts and readingReducer.ts are pure and import nothing from React DOM, so a React Native or Node.js app could take them as they are; the components, CardBoundary and the context provider are web views.

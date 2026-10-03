// Which params each screen of the stack receives.
// undefined means "this screen takes no params".
export type RootStackParamList = {
  List: undefined;
  // TODO: Detail and Edit
};

// The props a screen gets from the stack: navigation and route (with route.params).
export type ScreenProps<Name extends keyof RootStackParamList> = {
  navigation: {
    push: (name: keyof RootStackParamList, params?: object) => void;
    goBack: () => void;
  };
  route: { key: string; name: Name; params: RootStackParamList[Name] };
};

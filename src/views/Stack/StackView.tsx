import * as React from 'react';
import { SceneView, StackActions } from '@react-navigation/core';
import Stack from './Stack';
import {
  DefaultTransition,
  ModalSlideFromBottomIOS,
} from '../../TransitionConfigs/TransitionPresets';
import {
  NavigationProp,
  SceneDescriptor,
  NavigationConfig,
  Route,
} from '../../types';
import { Platform } from 'react-native';

type Props = {
  navigation: NavigationProp;
  descriptors: { [key: string]: SceneDescriptor };
  navigationConfig: NavigationConfig;
  onTransitionStart?: () => void;
  onGestureBegin?: () => void;
  onGestureCanceled?: () => void;
  onGestureEnd?: () => void;
  screenProps?: unknown;
};

type State = {
  routes: Route[];
  descriptors: { [key: string]: SceneDescriptor | undefined };
};

class StackView extends React.Component<Props, State> {
  static getDerivedStateFromProps(
    props: Readonly<Props>,
    state: Readonly<State>
  ) {
    const { index, routes, transitions } = props.navigation.state;

    return {
      routes: [
        ...routes.slice(0, index + 1),
        // We keep the routes which are popping away in the state so we can transition them
        ...state.routes.filter(r => transitions.popping.includes(r.key)),
      ],
      descriptors: { ...state.descriptors, ...props.descriptors },
    };
  }

  state: State = {
    routes: this.props.navigation.state.routes,
    descriptors: {},
  };

  private getTitle = ({ route }: { route: Route }) => {
    const descriptor = this.state.descriptors[route.key];
    const { headerTitle, title } = descriptor
      ? descriptor.options
      : { headerTitle: undefined, title: undefined };

    return headerTitle !== undefined ? headerTitle : title;
  };

  private renderScene = ({ route }: { route: Route }) => {
    const descriptor = this.state.descriptors[route.key];

    if (!descriptor) {
      return null;
    }

    const { navigation, getComponent } = descriptor;
    const SceneComponent = getComponent();

    const { screenProps } = this.props;

    return (
      <SceneView
        screenProps={screenProps}
        navigation={navigation}
        component={SceneComponent}
      />
    );
  };

  private handleGoBack = ({ route }: { route: Route }) =>
    this.props.navigation.dispatch(StackActions.pop({ key: route.key }));

  private handleTransitionComplete = ({ route }: { route: Route }) => {
    this.props.navigation.dispatch(
      StackActions.completeTransition({ key: route.key })
    );
  };

  private handleOpenRoute = ({ route }: { route: Route }) => {
    this.handleTransitionComplete({ route });
  };

  private handleCloseRoute = ({ route }: { route: Route }) => {
    this.setState(state => ({
      routes: state.routes.filter(r => r.key !== route.key),
      descriptors: { ...state.descriptors, [route.key]: undefined },
    }));

    this.props.navigation.dispatch(
      StackActions.pop({ key: route.key, immediate: true })
    );

    this.handleTransitionComplete({ route });
  };

  render() {
    const { navigation, navigationConfig } = this.props;
    const { pushing, popping } = navigation.state.transitions;

    const TransitionPreset =
      navigationConfig.mode === 'modal' && Platform.OS === 'ios'
        ? ModalSlideFromBottomIOS
        : DefaultTransition;
    const headerMode =
      navigationConfig.headerMode || TransitionPreset.headerMode;

    return (
      <Stack
        {...TransitionPreset}
        routes={this.state.routes}
        headerMode={headerMode}
        openingRoutes={pushing}
        closingRoutes={popping}
        onGoBack={this.handleGoBack}
        onOpenRoute={this.handleOpenRoute}
        onCloseRoute={this.handleCloseRoute}
        getTitle={this.getTitle}
        renderScene={this.renderScene}
      />
    );
  }
}

export default StackView;

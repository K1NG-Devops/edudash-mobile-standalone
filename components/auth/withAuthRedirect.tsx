import React from 'react';
import { router } from 'expo-router';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';

interface WithAuthRedirectState {
  lastUserState: any;
}

export function withAuthRedirect<P extends object>(
  WrappedComponent: React.ComponentType<P & { user: any; profile: any; signOut: () => Promise<void> }>
) {
  return class extends React.Component<P, WithAuthRedirectState> {
    state: WithAuthRedirectState = {
      lastUserState: null,
    };

    private checkAuthState = (user: any) => {
      // Check if user just signed out (was logged in, now not)
      if (this.state.lastUserState && !user) {
        setTimeout(() => {
          router.replace('/');
        }, 100);
        return false; // Don't render the component
      }

      // Update last user state
      if (this.state.lastUserState !== user) {
        this.setState({ lastUserState: user });
      }

      return true; // Continue rendering
    };

    render() {
      return (
        <AuthConsumer>
          {({ user, profile, signOut }) => {
            if (!this.checkAuthState(user)) {
              return null;
            }

            return (
              <WrappedComponent
                {...(this.props as P)}
                user={user}
                profile={profile}
                signOut={signOut}
              />
            );
          }}
        </AuthConsumer>
      );
    }
  };
}

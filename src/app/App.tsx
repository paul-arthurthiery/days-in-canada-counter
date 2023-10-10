import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { DarkTheme, BaseProvider, styled } from 'baseui';

import Dashboard from '../dashboard/Dashboard';
import './styles.scss';

const engine = new Styletron();

const Centered = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: DarkTheme.colors.backgroundPrimary,
  color: DarkTheme.colors.contentPrimary,
  fontFamily: DarkTheme.typography.font100.fontFamily,
  textAlign: 'center',
});

const App = () => (
  <StyletronProvider value={engine}>
    <BaseProvider theme={DarkTheme}>
      <Centered>
        <Dashboard />
      </Centered>
    </BaseProvider>
  </StyletronProvider>
);

export default App;

import { DarkTheme, BaseProvider, styled } from 'baseui';
import { Chart, ArcElement, Tooltip, Legend, LinearScale, PointElement, LineElement, TimeScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-adapter-date-fns';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';

import Dashboard from '../dashboard/Dashboard';
import './styles.scss';

dayjs.extend(utc);

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

Chart.register(ArcElement, Tooltip, Legend, TimeScale, LinearScale, PointElement, LineElement, ChartDataLabels);

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

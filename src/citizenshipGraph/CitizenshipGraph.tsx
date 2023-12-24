import { useStyletron } from 'baseui';
import { Line } from 'react-chartjs-2';

import { GraphData } from '../types';
import './styles.scss';

interface CitizenshipGraphProps {
  graphData: GraphData;
  dateFormat: string;
}

export default ({ graphData, dateFormat }: CitizenshipGraphProps) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        width: '100vw',
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      })}
    >
      <Line
        data={{
          labels: graphData.allEntriesAndExits.map((date) => date.format(dateFormat)),
          datasets: [
            {
              label: 'Citizenship days',
              data: graphData.citizenshipDaysPercentOverTime,
              pointStyle: false,
              borderColor: theme.colors.contentAccent,
              backgroundColor: theme.colors.contentAccent,
            },
            {
              label: 'Residency renewal days',
              data: graphData.residencyDaysPercentOverTime,
              pointStyle: false,
              borderColor: theme.colors.contentPositive,
              backgroundColor: theme.colors.contentPositive,
            },
          ],
        }}
        options={{
          plugins: {
            datalabels: {
              formatter: (_, { dataIndex, dataset }) => {
                if (dataIndex === dataset.data.length - 1) {
                  return graphData.allEntriesAndExits.at(-1)?.format(dateFormat);
                }
                return '';
              },
              align: 'left',
              backgroundColor: ({ dataIndex, dataset }) =>
                dataIndex === dataset.data.length - 1 ? theme.colors.contentPrimary : '',
              borderColor: ({ dataIndex, dataset }) =>
                dataIndex === dataset.data.length - 1 ? theme.colors.contentAccent : '',
              borderWidth: 1,
            },
            legend: {
              labels: {
                color: theme.colors.contentPrimary,
              },
            },
          },
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'month',
              },
              ticks: {
                maxTicksLimit: 30,
                color: theme.colors.contentPrimary,
              },
              grid: {
                drawTicks: true,
                tickWidth: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback(value) {
                  return `${value}%`;
                },
                color: theme.colors.contentPrimary,
              },
              grid: {
                drawTicks: true,
                color: theme.colors.backgroundTertiary,
                tickWidth: 0,
              },
            },
          },
          animations: {
            radius: {
              duration: 400,
              easing: 'linear',
              loop: (context) => context.active,
            },
          },
        }}
      />
    </div>
  );
};

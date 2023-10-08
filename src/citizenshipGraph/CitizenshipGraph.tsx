import { Line } from 'react-chartjs-2';
import { GraphData } from '../types';

interface CitizenshipGraphProps {
  graphData: GraphData,
  dateFormat: string,
}

export default ({graphData, dateFormat}: CitizenshipGraphProps) => (
    <Line
      data={{
        labels: graphData.allEntriesAndExits.map((date) => date.format(dateFormat)),
        datasets: [
          {
            label: 'Citizenship days',
            data: graphData.citizenshipDaysPercentOverTime,
            pointStyle: false,
            borderColor: '#FF6384',
            backgroundColor: '#FFB1C1',
          },
          {
            label: 'Residency renewal days',
            data: graphData.residencyDaysPercentOverTime,
            pointStyle: false,
            borderColor: '#36A2EB',
            backgroundColor: '#9BD0F5',
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
            backgroundColor: ({ dataIndex, dataset }) => (dataIndex === dataset.data.length - 1 ? '#FFF' : ''),
            borderColor: ({ dataIndex, dataset }) => (dataIndex === dataset.data.length - 1 ? '#FF6384' : ''),
            borderWidth: 1,
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
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback(value) {
                return `${value}%`;
              },
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
  )

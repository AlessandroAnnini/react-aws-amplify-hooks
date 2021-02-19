import { useEffect, useState } from 'react';
import API, { graphqlOperation } from '@aws-amplify/api';

const useSubscription = ({
  nodeName,
  listNodesQuery,
  listNodesQueryInput,
  onCreateSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  getNodeQuery,
  postProcess,
  isDebug,
}) => {
  const [data, setData] = useState([]);

  const Name =
    nodeName.charAt(0).toUpperCase() + nodeName.slice(1).toLowerCase();
  const queryName = `list${Name}s`;
  const onCreateSubscriptionName = `onCreate${Name}`;
  const onUpdateSubscriptionName = `onUpdate${Name}`;
  const onDeleteSubscriptionName = `onDelete${Name}`;
  const getQueryName = `get${Name}`;

  // GET DATA FIRST TIME
  useEffect(() => {
    if (isDebug) {
      console.log(`
  useAwsList for ${nodeName} node
  \tcreate queryName: ${queryName}
  \tcreate onCreateSubscriptionName: ${onCreateSubscriptionName}
  \tcreate onUpdateSubscriptionName: ${onUpdateSubscriptionName}
  \tcreate onDeleteSubscriptionName: ${onDeleteSubscriptionName}
  \tcreate getQueryName: ${getQueryName}

  input', ${JSON.stringify(listNodesQueryInput, null, 2)}
      `);
    }

    if (listNodesQuery && listNodesQueryInput) {
      const runBaseQuery = async () => {
        const result = await API.graphql(
          graphqlOperation(listNodesQuery, listNodesQueryInput)
        );
        const baseData = result.data[queryName].items;
        isDebug && console.log(queryName, baseData);
        setData(postProcess ? postProcess(baseData) : baseData);
      };

      runBaseQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ON CREATE SUBSCRIPTION
  useEffect(() => {
    if (onCreateSubscription) {
      const runSubscription = () =>
        API.graphql(graphqlOperation(onCreateSubscription)).subscribe({
          next: async (eventData) => {
            isDebug && console.log(onCreateSubscriptionName);
            const baseData = eventData.value.data[onCreateSubscriptionName];
            isDebug && console.log('created', baseData);
            const result = await API.graphql(
              graphqlOperation(getNodeQuery, { id: baseData.id })
            );
            const obj = result.data[getQueryName];
            const nextData = [...data, obj];
            setData(postProcess ? postProcess(nextData) : nextData);
          },
        });

      const listener = runSubscription();

      return () => listener.unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ON UPDATE SUBSCRIPTION
  useEffect(() => {
    if (onUpdateSubscription) {
      const runSubscription = () =>
        API.graphql(graphqlOperation(onUpdateSubscription)).subscribe({
          next: async (eventData) => {
            isDebug && console.log(onUpdateSubscriptionName);
            const baseData = eventData.value.data[onUpdateSubscriptionName];
            isDebug && console.log('updated', baseData);
            const result = await API.graphql(
              graphqlOperation(getNodeQuery, { id: baseData.id })
            );
            const obj = result.data[getQueryName];
            const oldData = data.filter((e) => e.id !== obj.id);
            const nextData = [...oldData, obj];
            setData(postProcess ? postProcess(nextData) : nextData);
          },
        });

      const listener = runSubscription();

      return () => listener.unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ON DELETE SUBSCRIPTION
  useEffect(() => {
    if (onDeleteSubscription) {
      const runSubscription = () =>
        API.graphql(graphqlOperation(onDeleteSubscription)).subscribe({
          next: async (eventData) => {
            isDebug && console.log(onDeleteSubscriptionName);
            const baseData = eventData.value.data[onDeleteSubscriptionName];
            isDebug && console.log('deleted', baseData);
            const nextData = data.filter((e) => e.id !== baseData.id);
            setData(postProcess ? postProcess(nextData) : nextData);
          },
        });

      const listener = runSubscription();

      return () => listener.unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return [data, setData];
};

export { useSubscription };

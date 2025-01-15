import { useEffect } from "react";
import pkg from '@apollo/client';
const { gql, useMutation } = pkg;

// GraphQL Mutation for creating ScriptTag
const SCRIPT_TAG_CREATE = gql`
  mutation ScriptTagCreate($input: ScriptTagInput!) {
    scriptTagCreate(input: $input) {
      scriptTag {
        id
        cache
        createdAt
        displayScope
        src
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ScriptPage = () => {
  const [createScriptTag, { data, loading, error }] = useMutation(SCRIPT_TAG_CREATE);

  useEffect(() => {
    // Only run the alert on the client-side
    if (typeof window !== "undefined") {
      setInterval(() => {
        alert("Reminder: You are viewing premium products!");
      }, 60000); // Display reminder every 60 seconds
    }

    const scriptContent = `
      setInterval(() => {
        alert("Reminder: You are viewing premium products!");
      }, 60000);
    `;

    const blob = new Blob([scriptContent], { type: "application/javascript" });
    const scriptURL = URL.createObjectURL(blob);

    createScriptTag({
      variables: {
        input: {
          src: scriptURL, // Using Blob URL as script source
          displayScope: "ONLINE_STORE",
          cache: false,
        },
      },
    });

    return () => {
      URL.revokeObjectURL(scriptURL); // Cleanup URL object
    };
  }, [createScriptTag]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <div>ScriptPage - Script Added Successfully</div>;
};

export default ScriptPage;

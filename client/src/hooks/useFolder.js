import { firestore, database } from "../firebase";
import {
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useEffect, useReducer } from "react";
import { useAuth } from "../contexts/AuthContext";

const ACTIONS = {
  SELECT_FOLDER: "select-folder",
  UPDATE_FOLDER: "update-folder",
  SET_CHILD_FOLDERS: "set-child-folders",
};

export const ROOT_FOLDER = { name: "Root", id: null, path: [] };

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SELECT_FOLDER:
      return {
        folderId: payload.folderId,
        folder: payload.folder,
        childFiles: [],
        childFolders: [],
      };
    case ACTIONS.UPDATE_FOLDER:
      return {
        ...state,
        folder: payload.folder,
      };
    case ACTIONS.SET_CHILD_FOLDERS:
      return {
        ...state,
        childFolders: payload.childFolders,
      };
    default:
      return state;
  }
}

export function useFolder(folderId = null, folder = null) {
  const [state, dispatch] = useReducer(reducer, {
    folderId,
    folder,
    childFolders: [],
    childFiles: [],
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    dispatch({ type: ACTIONS.SELECT_FOLDER, payload: { folderId, folder } });
  }, [folderId, folder]);

  useEffect(() => {
    if (folderId == null) {
      return dispatch({
        type: ACTIONS.UPDATE_FOLDER,
        payload: { folder: ROOT_FOLDER },
      });
    }

    const getFolder = async () => {
      const docRef = doc(firestore, "folders", folderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: { folder: database.formatDoc(docSnap) },
        });
        // console.log("Document data:", database.formatDoc(docSnap));
      } else {
        // doc.data() will be undefined in this case
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: { folder: ROOT_FOLDER },
        });
      }
    };

    getFolder();
  }, [folderId]);

  useEffect(() => {
    const q = query(
      database.folders,
      where("parentId", "==", folderId),
      where("userId", "==", currentUser.uid)
      // orderBy("createdAt")
    );
    // const sort = query(q, orderBy("createdAt"));
    return onSnapshot(q, (snapshot) => {
      dispatch({
        type: ACTIONS.SET_CHILD_FOLDERS,
        payload: { childFolders: snapshot.docs.map(database.formatDoc) },
      });
    });
  }, [folderId, currentUser]);

  return state;
}

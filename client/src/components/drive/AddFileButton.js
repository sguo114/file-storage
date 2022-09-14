import React from "react";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { storage, database } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function AddFileButton({ currentFolder }) {
  const { currentUser } = useAuth();

  function handleUpload(e) {
    const file = e.target.files[0];
    if (currentFolder == null || file == null) return;
    console.log(currentFolder.name, currentFolder);
    const filePath =
      currentFolder === ROOT_FOLDER
        ? `${currentFolder.path.map((folder) => folder.name).join("/")}/${
            file.name
          }`
        : `${currentFolder.path.map((folder) => folder.name).join("/")}/${
            currentFolder.name
          }/${file.name}`;
    console.log(filePath);

    const storageRef = ref(storage, `/files/${currentUser.uid}/${filePath}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {},
      () => {},
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
          //   console.log(url);
          try {
            await addDoc(database.files, {
              url: url,
              name: file.name,
              createdAt: serverTimestamp(),
              folderId: currentFolder.id,
              userId: currentUser.uid,
            });
          } catch (e) {
            console.error("Error adding document: ", e);
          }
        });
      }
    );
  }

  return (
    <label className="btn btn-outline-success btn-sm m-0 me-2">
      <FontAwesomeIcon icon={faFileUpload} />
      <input
        type="file"
        onChange={handleUpload}
        style={{ opacity: 0, position: "absolute", left: "-9999px" }}
      />
    </label>
  );
}

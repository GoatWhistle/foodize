import { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@shared/store/useAuthStore.instance.js";
import { userService } from "@shared/services/userService.js";
import { translateApiError } from "@shared/utils/translateApiError.js";

export const useProfilePage = () => {
  const { user, logout, fetchMe } = useAuthStore(
    useShallow((s) => ({ user: s.user, logout: s.logout, fetchMe: s.fetchMe })),
  );

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", first_name: "", last_name: "", middle_name: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const startEdit = () => {
    setEditForm({
      name: user?.name ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      middle_name: user?.middle_name ?? "",
      email: user?.email ?? "",
    });
    setEditMode(true);
    setEditError("");
    setEditSuccess(false);
  };

  const cancelEdit = () => setEditMode(false);

  const handleSave = async () => {
    setEditLoading(true);
    setEditError("");
    setEditSuccess(false);
    try {
      await userService.updateMe(editForm);
      await fetchMe();
      setEditSuccess(true);
      setEditMode(false);
    } catch (err) {
      setEditError(translateApiError(err, "Не удалось сохранить"));
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e?.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await userService.changePassword(pwForm);
      setPwSuccess(true);
      setPwForm({ old_password: "", new_password: "" });
    } catch (err) {
      setPwError(translateApiError(err, "Не удалось сменить пароль"));
    } finally {
      setPwLoading(false);
    }
  };

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || "Пользователь";

  return {
    user,
    logout,
    displayName,
    editMode,
    editForm,
    setEditForm,
    editLoading,
    editError,
    editSuccess,
    startEdit,
    cancelEdit,
    handleSave,
    pwForm,
    setPwForm,
    pwLoading,
    pwError,
    pwSuccess,
    handlePasswordChange,
  };
};

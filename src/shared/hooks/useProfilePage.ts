import { useState, useCallback } from "react";
import type { Dispatch, SyntheticEvent, SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@shared/store/useAuthStore.instance";
import type { AuthStoreState, AuthUser } from "@shared/store/createAuthStore";
import { userService } from "@shared/services/userService";
import { translateApiError } from "@shared/utils/translateApiError";

interface EditForm {
  name: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
}

interface PasswordForm {
  old_password: string;
  new_password: string;
}

export interface UseProfilePageResult {
  user: AuthUser | null;
  logout: () => Promise<void>;
  displayName: string;
  editMode: boolean;
  editForm: EditForm;
  setEditForm: Dispatch<SetStateAction<EditForm>>;
  editLoading: boolean;
  editError: string;
  editSuccess: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  handleSave: () => Promise<void>;
  pwForm: PasswordForm;
  setPwForm: Dispatch<SetStateAction<PasswordForm>>;
  pwLoading: boolean;
  pwError: string;
  pwSuccess: boolean;
  handlePasswordChange: (e?: SyntheticEvent) => Promise<void>;
}

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const useProfilePage = (): UseProfilePageResult => {
  const { user, logout, fetchMe } = useAuthStore(
    useShallow((s: AuthStoreState) => ({ user: s.user, logout: s.logout, fetchMe: s.fetchMe })),
  );

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  const [pwForm, setPwForm] = useState<PasswordForm>({ old_password: "", new_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const startEdit = useCallback(() => {
    setEditForm({
      name: asString(user?.name),
      first_name: asString(user?.first_name),
      last_name: asString(user?.last_name),
      middle_name: asString(user?.middle_name),
      email: asString(user?.email),
    });
    setEditMode(true);
    setEditError("");
    setEditSuccess(false);
  }, [user]);

  const cancelEdit = () => { setEditMode(false); };

  const handleSave = async (): Promise<void> => {
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

  const handlePasswordChange = async (e?: SyntheticEvent): Promise<void> => {
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
    user?.first_name && asString(user.last_name)
      ? `${user.first_name} ${asString(user.last_name)}`
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

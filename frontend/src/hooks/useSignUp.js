import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api";

const useSignUp = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error, data } = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      // Don't invalidate queries since user isn't logged in yet
      // They need to verify email first
    },
  });

  return { isPending, error, signupMutation: mutate, data };
};
export default useSignUp;



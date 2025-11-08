import Swal from 'sweetalert2';

export const showAlert = (title, text, icon = 'info') => {
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#2563eb', // azul Tailwind
  });
};
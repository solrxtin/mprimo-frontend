import React from "react";
import Modal2 from "../Modal2";
import { ClipLoader } from "react-spinners";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  logout: () => void;
  loading?: boolean;
}
const LogOutPromptModal = ({
  isOpen,
  onClose,
  logout,
  loading,
}: BidModalProps) => {
  return (
    <Modal2 isOpen={isOpen} onClose={onClose}>
        <div className="inline-block overflow-hidden text-left pb-4  px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-[white] rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-[587px] sm:w-full">
          <h2 className="text-xl font-bold mb-4">Log Out</h2>
          <p className="mb-4">Are you sure you want to log out?</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="mr-4 px-4 py-2 bg-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              {loading ? (
                <ClipLoader color="white" size={16} className="mr-2" />
              ) : (
                "Log Out"
              )}
            </button>
          </div>
      </div>
    </Modal2>
  );
};

export default LogOutPromptModal;

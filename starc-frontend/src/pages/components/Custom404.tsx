import React from "react";
import Image from "next/image";
import oopsFace from "../../assets/oops-face.svg";
import backArrow from "../../assets/back-arrow.svg";
import { useRouter } from "next/router";

const NoContent: React.FC = () => {
  const router = useRouter();
  // Sends user back to the previous valid url they were on
  const goBack = () => {
    router.back();
  };

  return (
    // Static component indicating that the page is not in the scope of this assignment
    <div className="flex h-screen w-screen flex-col items-center justify-center space-y-42 bg-secondary-background-404">
      <div className="text-xxl font-bold">Oops!</div>
      <div className="text-lg_2 font-semibold">What are you doing here?</div>
      <Image src={oopsFace} alt="404" width={500} height={500} />
      <div className="w-380 text-center text-m_2">
        This page is a <span className="font-bold">future</span> functionality{" "}
        <span className="font-bold">not</span> in the scope of this assignment.
        Now go back to making your pitch perfect!
      </div>
      {/* Link to send user back to previous page */}
      <div className="flex cursor-pointer gap-12" onClick={goBack}>
        <Image src={backArrow} alt="back" />
        <div className="text-lg_1 font-semibold">Go Back</div>
      </div>
    </div>
  );
};

export default NoContent;

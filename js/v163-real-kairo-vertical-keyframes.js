/* V163: exactly model-baked VRM0 quaternion PEAKS from successful Pose Lab
 * study 40410045312 (artifact 12693475823). Five real source keyframes:
 * times 0/.16/.38/.68/1.2s, Q hover -> intermediate -> peak -> hold.
 * Full absolute, normalized joint quaternions; no guessed Euler offsets.
 * Candidate animation requires player review. Default V156 is untouched.
 */
(function(root){'use strict';
 const bones=['hips','spine','chest','upperChest','neck','head',
 'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
 'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
 'leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];
 const ascend=[
[.1195642,-.3684558,.0054829,.9219082],[-.0877331,.0422296,.0307338,.9947738],[-.0896226,.0805676,.0065781,.99269],[-.0980335,.0804664,.0176303,.991768],
[.0262223,-.0118029,.0007537,.9995862],[.0553467,.1773127,.0104974,.982541],[.1104735,.1610705,-.0007387,-.9807402],[.0499822,.1267591,.4758154,.8689267],
[-.0887894,-.3791325,.0532408,.9195327],[-.1399604,-.0145552,-.153772,.9780355],[.0873254,.0913357,.1521386,-.9802479],[.368035,.1612094,-.3033501,.8640257],
[-.1878823,.1012145,-.3541641,.9105074],[-.0584058,.0821201,-.0954901,.9903165],[.1843356,.1268546,-.3501693,.9095657],[-.5096268,.0321758,.2974401,.806706],
[-.0558678,.1055932,.0060406,.9928204],[.1116443,-.1312133,-.0185344,.9848731],[-.2116931,-.0270868,.2852774,.9343817],[-.3623756,.0380971,-.1168501,.9238932]];
 const descend=[
[.1195642,-.3684558,.0054829,.9219082],[-.0877331,.0422296,.0307338,.9947738],[-.114753,.0798806,.023695,.9898936],[-.0980335,.0804664,.0176303,.991768],
[.0425413,-.0100772,-.0051636,.9990305],[.0724198,.1782984,.0072479,.9812811],[.1104735,.1610705,-.0007387,-.9807402],[.1242216,.0834202,.280732,.9480504],
[-.1136944,-.362147,.1260261,.9165373],[-.1399604,-.0145552,-.153772,.9780355],[.0873254,.0913357,.1521386,-.9802479],[.4653815,.3512687,-.2421169,.7755061],
[-.224534,.0096822,-.3751889,.8992908],[-.0584058,.0821201,-.0954901,.9903165],[-.0141712,.1520625,-.2037126,.9670457],[-.2652255,.0386832,.1735322,.9476527],
[-.0558678,.1055932,.0060406,.9928204],[.1096773,-.1311454,-.0157672,.9851513],[-.178165,-.027819,.2579374,.9491847],[-.3623756,.0380971,-.1168501,.9238932]];
 const times=[0,.16,.38,.68,1.2],weights=[0,.28,.78,1,1];
 function keyWeight(time){
  const t=Math.max(0,Math.min(1.2,Number.isFinite(time)?time:0));
  for(let i=1;i<times.length;i++)if(t<=times[i]){
   const f=(t-times[i-1])/(times[i]-times[i-1]);
   return weights[i-1]+(weights[i]-weights[i-1])*f;
  }
  return 1;
 }
 const api=Object.freeze({
  modelSha256:'775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72',
  bones:Object.freeze(bones),times:Object.freeze(times),weights:Object.freeze(weights),
  kind:'real-vrm0-baked-pose-lab-keyframes',approval:'experimental-only',
  sourceWorkflow:40410045312,
  ascend:Object.freeze(ascend.map(x=>Object.freeze(x))),
  descend:Object.freeze(descend.map(x=>Object.freeze(x))),keyWeight
 });
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV163VerticalKeyframes=api;
})(typeof window!=='undefined'?window:globalThis);

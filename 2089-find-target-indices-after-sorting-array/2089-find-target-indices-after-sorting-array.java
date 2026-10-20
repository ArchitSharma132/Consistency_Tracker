class Solution {
    public List<Integer> targetIndices(int[] nums, int target) {
        int n=nums.length;
        ArrayList<Integer> sol=new ArrayList<>();
        Arrays.sort(nums);
        for(int i=0;i<n;i++){
            if(nums[i]==target){
                sol.add(i);
            }
        }
        return sol;
    }
}
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Edit2, Check, X, ShieldAlert, BarChart3, Target, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface CaseData {
  category?: string;
  issue?: string;
  stage?: string;
  desiredOutcome?: string;
  confidence?: number;
}

interface CaseUnderstandingProps {
  data: CaseData;
  onEdit?: (newData: CaseData) => void;
  className?: string;
}

export function CaseUnderstanding({ data, onEdit, className }: CaseUnderstandingProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<CaseData>(data);

  const handleSave = () => {
    setIsEditing(false);
    onEdit?.(editData);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const hasData = data.category || data.issue || data.stage || data.desiredOutcome;
  if (!hasData && !isEditing) return null;

  return (
    <div className={cn("rounded-xl border border-primary/20 bg-primary/5 p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <FileText className="h-4 w-4" />
          <span className="text-sm">Case Understanding</span>
        </div>
        {!isEditing && onEdit && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-2 text-xs text-primary/70 hover:text-primary hover:bg-primary/10">
            <Edit2 className="mr-1.5 h-3 w-3" /> Edit
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Category</label>
                <Input 
                  value={editData.category || ''} 
                  onChange={(e) => setEditData({...editData, category: e.target.value})}
                  placeholder="e.g. Family Law"
                  className="h-8 text-xs bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Stage</label>
                <Input 
                  value={editData.stage || ''} 
                  onChange={(e) => setEditData({...editData, stage: e.target.value})}
                  placeholder="e.g. Pre-litigation"
                  className="h-8 text-xs bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Core Issue</label>
                <Input 
                  value={editData.issue || ''} 
                  onChange={(e) => setEditData({...editData, issue: e.target.value})}
                  placeholder="Describe the main legal issue"
                  className="h-8 text-xs bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Desired Outcome</label>
                <Input 
                  value={editData.desiredOutcome || ''} 
                  onChange={(e) => setEditData({...editData, desiredOutcome: e.target.value})}
                  placeholder="What is the goal?"
                  className="h-8 text-xs bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 text-xs">
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                <Check className="mr-1 h-3 w-3" /> Save Changes
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {data.category && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0 bg-primary/10 p-1 rounded-md text-primary"><ShieldAlert className="h-3 w-3" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Category</p>
                  <p className="text-xs font-medium">{data.category}</p>
                </div>
              </div>
            )}
            {data.stage && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0 bg-primary/10 p-1 rounded-md text-primary"><GitMerge className="h-3 w-3" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Stage</p>
                  <p className="text-xs font-medium">{data.stage}</p>
                </div>
              </div>
            )}
            {data.issue && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <div className="mt-0.5 shrink-0 bg-primary/10 p-1 rounded-md text-primary"><FileText className="h-3 w-3" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Core Issue</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{data.issue}</p>
                </div>
              </div>
            )}
            {data.desiredOutcome && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <div className="mt-0.5 shrink-0 bg-primary/10 p-1 rounded-md text-primary"><Target className="h-3 w-3" /></div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Desired Outcome</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{data.desiredOutcome}</p>
                </div>
              </div>
            )}
            {data.confidence !== undefined && (
              <div className="sm:col-span-2 flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>AI Confidence Score</span>
                </div>
                <Badge variant={data.confidence > 80 ? "default" : data.confidence > 50 ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5">
                  {data.confidence}%
                </Badge>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

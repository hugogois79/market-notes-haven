
import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TagBadge from "@/components/ui/tag-badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "@/types";

interface TagWithCount extends Tag {
  count: number;
  isSelected?: boolean;
}

interface CategoryListProps {
  categories: string[];
  tags: TagWithCount[];
  onSelectCategory: (category: string | null) => void;
  onSwitchToTagsTab: () => void;
}

const CategoryList = ({
  categories,
  tags,
  onSelectCategory,
  onSwitchToTagsTab
}: CategoryListProps) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FolderOpen size={20} className="text-[#1EAEDB]" />
        Categories
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length > 0 ? (
          categories.map(category => {
            const categoryTags = tags.filter(tag => tag.category === category);
            return (
              <Card key={category} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-[#1EAEDB]" />
                      <span>{category}</span>
                    </div>
                    <Badge>{categoryTags.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {categoryTags.length} {categoryTags.length === 1 ? 'tag' : 'tags'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-auto mb-4">
                    {categoryTags.slice(0, 8).map(tag => (
                      <TagBadge key={tag.id} tag={tag.name} count={tag.count} />
                    ))}
                    {categoryTags.length > 8 && (
                      <Badge variant="outline">+{categoryTags.length - 8} more</Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      onSelectCategory(category);
                      onSwitchToTagsTab();
                    }}
                  >
                    View Tags
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center p-8 border border-dashed rounded-lg">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No categories found. Add categories to organize your tags.</p>
            <p className="text-sm text-muted-foreground">
              Categories can be created in the Notes Editor or from the Categories page.
            </p>
          </div>
        )}
        
        {tags.filter(tag => !tag.category).length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <span>Uncategorized</span>
                </div>
                <Badge variant="outline">
                  {tags.filter(tag => !tag.category).length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {tags.filter(tag => !tag.category).length} {tags.filter(tag => !tag.category).length === 1 ? 'tag' : 'tags'} without a category
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex flex-wrap gap-2 max-h-24 overflow-auto mb-4">
                {tags.filter(tag => !tag.category).slice(0, 8).map(tag => (
                  <TagBadge key={tag.id} tag={tag.name} count={tag.count} />
                ))}
                {tags.filter(tag => !tag.category).length > 8 && (
                  <Badge variant="outline">+{tags.filter(tag => !tag.category).length - 8} more</Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  onSelectCategory(null);
                  onSwitchToTagsTab();
                }}
              >
                View Tags
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
